import asyncio
import json
import logging
import websockets
import threading
import moment
from datetime import datetime


class User:
    def __init__(self, websocket):
        self.websocket = websocket
        self.alarms = []

    def getTime(self):
        time = moment.utcnow().timezone(self.timezone).format("HH:mm:ss")
        return json.dumps({"t": time})

    def addAlarm(self, milliseconds):
        self.alarms.append(moment.utcnow().timezone(
            self.timezone).add(milliseconds=milliseconds))

    def checkAlarm(self):
        trigger = []
        for alarm in list(self.alarms):
            if moment.utcnow().epoch() > alarm.epoch():
                self.alarms.remove(alarm)
                trigger.append(json.dumps({"alarm": "true"}))
        return trigger


USERS = set()


async def broadcastTime():
    if USERS:  # asyncio.wait doesn't accept an empty list
        for u in USERS:
            await asyncio.wait(u.websocket.send("test"))


async def unregister(user):
    USERS.remove(user)


async def clock(websocket, path):
    # register(websocket) sends user_event() to websocket

    user = User(websocket)

    try:
        async for message in websocket:
            data = json.loads(message)
            if 'timezone' in data:
                user.timezone = data["timezone"]
                USERS.add(user)
            elif 'alarm' in data:
                user.addAlarm(data["alarm"])
    finally:
        USERS.remove(user)


async def broadcast():
    while True:

        for u in USERS:

            await asyncio.gather(
                *[u.websocket.send(u.getTime())],
                return_exceptions=False,
            )

            for t in u.checkAlarm():
                await asyncio.gather(
                    *[u.websocket.send(t)],
                    return_exceptions=False,
                )
        await asyncio.sleep(0.1)

asyncio.get_event_loop().create_task(broadcast())

# starting the server
start_server = websockets.serve(clock, "localhost", 8081)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
