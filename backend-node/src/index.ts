import WebSocket from "ws"
import Moment from "moment-timezone"

const PORT = 8080
const server: WebSocket.Server = new WebSocket.Server({ port: PORT })
let clients: Client[] = []

class Client {
    ws: WebSocket
    timezone: string
    alarms: Moment.Moment[] = []

    constructor(ws: WebSocket, timezone: string) {
        this.ws = ws
        this.timezone = timezone
        let self = this

        ws.on('message', function message(m) {
            let message = JSON.parse(m.toString())

            // deal with timezone change
            if (message.timezone) {
                self.timezone = JSON.parse(m.toString()).timezone
            } else if (message.alarm) {
                self.alarms.push(Moment().tz(self.timezone).add(message.alarm, "milliseconds"))
            }

        });

    }

    sendTime() {
        this.ws.send(JSON.stringify({ t: Moment().tz(this.timezone).format("HH:mm:ss") }))

    }

    sendAlarm() {
        this.ws.send(JSON.stringify({ alarm: true }))
    }

    checkAlarm() {
        let now = Moment().tz(this.timezone)
        let self = this
        this.alarms.forEach(function (alarm, index, object) {
            if (now.isAfter(alarm)) {
                object.splice(index, 1);
                self.sendAlarm()
            }
        });
    }
}

server.on('connection', function connection(ws) {
    // the timer 
    let client = new Client(ws, Moment.tz.guess())
    clients.push(client)
});

// global interval
setInterval(() => {
    
    clients.forEach(c => {
        c.sendTime()
        c.checkAlarm()
    });

}, 100)