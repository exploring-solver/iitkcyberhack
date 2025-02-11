import React from 'react';
import { Web3Provider } from './contexts/Web3Context';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Web3Provider>
      <Dashboard />
    </Web3Provider>
  );
}

export default App;