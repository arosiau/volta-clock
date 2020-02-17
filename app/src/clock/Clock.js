import React from 'react';
import './Clock.css';
import moment from 'moment-timezone';
import { LOGS_LEVEL } from '../logs/Logs'
import Logs from '../logs/Logs'
import addAlarmLogo from '../add_alarm.svg'; // Tell Webpack this JS file uses this image

class Clock extends React.Component {

    ws
    constructor(props) {
        super(props)
        this.state = { connected: false, timezone: moment.tz.guess(), logs: [], url: 'ws://localhost:' + this.props.port };
        this.changeTimezone = this.changeTimezone.bind(this);
        this.sendAlarm = this.sendAlarm.bind(this);
    }

    addLog(level, message) {
        this.setState({ logs: this.state.logs.concat({ level: level, message: message }) })
    }

    componentDidMount() {

        this.addLog(LOGS_LEVEL.INFO, "Connecting ...")
        this.ws = new WebSocket(this.state.url)
        this.ws.onopen = (ws, ev) => {

            this.addLog(LOGS_LEVEL.INFO, "Connected to : " + this.state.url)
            this.setState({ connected: true })
            // send the detected timezone to the server
            this.sendTimezone(moment.tz.guess())
        }


        this.ws.onmessage = evt => {
            let data = JSON.parse(evt.data)
            if (data.t) {
                this.setState(({ lastTime: data.t }))
            } else if (data.alarm) {
                this.addLog(LOGS_LEVEL.INFO, "Alarm triggered !!!")
            }

        }

        this.ws.onerror = evt => {
            this.addLog(LOGS_LEVEL.ERROR, "Error connecting to : " + this.state.url)
        }

    }


    render() {
        return (
            <div className="clock">
                <div className="header">
                    <span className="language">{this.props.language}</span>

                    {/* little trick to test conditionnal display of elements */}
                    {this.state.connected
                        &&
                        <React.Fragment>
                            <select onChange={this.changeTimezone} value={this.state.timezone}>
                                {moment.tz.names().map(item => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <img className="alarm" src={addAlarmLogo} alt="Logo" onClick={this.sendAlarm} />
                        </React.Fragment>
                    }

                </div>
                <div className="time">
                    {this.state.lastTime}
                </div>
                <Logs className="logs" logs={this.state.logs} />
            </div>
        );
    }

    sendTimezone(timezone) {
        this.setState({ timezone: timezone })
        this.ws.send(JSON.stringify({ timezone: timezone }))
    }

    sendAlarm() {
        let seconds = 10
        this.addLog(LOGS_LEVEL.INFO, "Adding an alarm in  : " + seconds + " seconds")
        this.ws.send(JSON.stringify({ alarm: seconds * 1000 }))
    }

    changeTimezone(event) {
        let timezone = event.target.value
        this.addLog(LOGS_LEVEL.INFO, "Changing timezone to : " + timezone)
        this.sendTimezone(timezone)
    }

}

export default Clock;