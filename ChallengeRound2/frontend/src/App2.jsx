import React, { useState, useContext } from 'react';
import TokenBridge from './components/TokenBridge2';
import NFTBridge from './components/NFTBridge';
import { Web3Context } from './context/Web3Context';

function App() {
  const [activeTab, setActiveTab] = useState('token');
  const {
    account,
    networkName,
    availableNetworks,
    availableAccounts,
    showAccountSelector,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    selectAccount,
    setShowAccountSelector
  } = useContext(Web3Context);

  return (
    <div className="min-h-screen bg-gray-900">
      {showAccountSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-white">Select Account</h2>
            <div className="space-y-2">
              {availableAccounts.map((acc) => (
                <button
                  key={acc}
                  onClick={() => selectAccount(acc)}
                  className="w-full text-left px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  {acc.slice(0, 6)}...{acc.slice(-4)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAccountSelector(false)}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <nav className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold py-4 text-white">Cross-Chain Bridge</h1>
            
            <div className="flex items-center space-x-4">
              {account ? (
                <>
                  <select
                    className="bg-gray-700 text-white px-3 py-2 rounded-lg"
                    value={networkName.toUpperCase()}
                    onChange={(e) => switchNetwork(e.target.value)}
                    disabled={loading}
                  >
                    {availableNetworks.map((network) => (
                      <option key={network} value={network}>
                        {network}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowAccountSelector(true)}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </button>
                  
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => connectWallet()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>

          <div className="flex">
            <button
              className={`px-4 py-4 text-white ${activeTab === 'token' ? 'border-b-2 border-indigo-500' : ''}`}
              onClick={() => setActiveTab('token')}
            >
              Token Bridge
            </button>
            <button
              className={`px-4 py-4 text-white ${activeTab === 'nft' ? 'border-b-2 border-indigo-500' : ''}`}
              onClick={() => setActiveTab('nft')}
            >
              NFT Bridge
            </button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="bg-red-600 text-white p-4 text-center">
          {error}
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'token' ? <TokenBridge /> : <NFTBridge />}
      </main>
    </div>
  );
}

export default App; 