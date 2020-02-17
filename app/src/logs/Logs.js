import React from 'react';
import './Logs.css';

export const LOGS_LEVEL = {
    ERROR: "ERROR",
    INFO: "INFO"
};

class Logs extends React.Component {

    render() {
        return (
            <div className="logs">
                {this.props.logs.map((l, i) => (
                    <div className={l.level.toLowerCase()} key={i}>[{l.level}] : {l.message}</div>
                ))}
            </div>
        );
    }


}

export default Logs;