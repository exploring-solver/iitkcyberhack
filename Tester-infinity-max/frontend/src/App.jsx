import React from 'react';
import { Web3Provider } from './contexts/Web3Context';
import Dashboard from './components/Dashboard';
import Bridge from './components/Bridge';
import { BridgeProvider } from './contexts/BridgeContext';

function App() {
  return (
    <Web3Provider>
    <BridgeProvider>
      <Dashboard />
    </BridgeProvider>
    </Web3Provider>
  );
}

export default App;