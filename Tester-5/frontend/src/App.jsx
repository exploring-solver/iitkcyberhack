import React from 'react';
import { Web3Provider } from './contexts/Web3Context';
import Dashboard from './components/Dashboard';
import Bridge from './components/Bridge';
import { BridgeProvider } from './contexts/BridgeContext';
import { RelayerProvider } from './contexts/RelayerContext';

function App() {
  return (
    <Web3Provider>
      <RelayerProvider>
        <BridgeProvider>
          <Dashboard />
        </BridgeProvider>
      </RelayerProvider>
    </Web3Provider>
  );
}

export default App;