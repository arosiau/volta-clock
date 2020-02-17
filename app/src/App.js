import React from 'react';
import Clock from './clock/Clock'
import './App.css';

function App() {
  return (
    <div className="App">
      <Clock language="Node.js" port={8080} />
      <Clock language="Python" port={8081} />
    </div>
  );
}

export default App;
