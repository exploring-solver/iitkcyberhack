import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { sepolia, polygonAmoy } from './utils/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

import { BlockchainProvider } from './contexts/BlockchainContext';
import { WalletConnector } from './components/WalletConnector';
import { TokenForm } from './components/TokenForm';
import { NFTGallery } from './components/NFTGallery';
import { BalanceCard } from './components/BalanceCard';

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, polygonAmoy],
  [publicProvider()]
);

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

function App() {
  return (
    <WagmiConfig config={config}>
      <BlockchainProvider>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-center mb-8">
              Blockchain Testing DApp
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <WalletConnector />
                <TokenForm />
                <BalanceCard />
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                <NFTGallery />
              </div>
            </div>
          </div>
        </div>
      </BlockchainProvider>
    </WagmiConfig>
  );
}

export default App;