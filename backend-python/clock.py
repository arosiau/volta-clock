import asyncio
import json
import websockets
import threading
import moment

#User class
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


# set of Users
USERS = set()

async def clock(websocket, path):
    # create a user
    user = User(websocket)
    try:

        async for message in websocket:
            data = json.loads(message)
            # if timezone specified change it
            if 'timezone' in data:
                user.timezone = data["timezone"]
                USERS.add(user)
            # if alarm specified add it
            elif 'alarm' in data:
                user.addAlarm(data["alarm"])
    finally:
        # remove user from the set
        USERS.remove(user)

# broadcast loop to send time to users and check alarms
async def broadcast_loop():
    while True:
        #for each user 
        for u in USERS:
            # broadcast time based on user timezone
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

asyncio.get_event_loop().create_task(broadcast_loop())

# starting the server
start_server = websockets.serve(clock, "localhost", 8081)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
