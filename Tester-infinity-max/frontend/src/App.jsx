import { Web3Provider } from './contexts/Web3Context';
import Dashboard from './components/Dashboard';
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