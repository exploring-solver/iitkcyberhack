import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const WalletConnection = () => {
  const {
    account,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchChain,
    fetchBalance
  } = useWeb3();

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case '0xAA36A7': return 'Sepolia';
      case '0x13882': return 'Amoy';
      case '0x7a69': return 'Local Amoy';
      case '0x7a6a': return 'Local Sepolia';
      default: return 'Unknown Network';
    }
  };

  const handleFetchBalance = async () => {
    if (account) {
      await fetchBalance(account);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900">Wallet Connection</h2>
            {account ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Connected Account: {`${account.slice(0, 6)}...${account.slice(-4)}`}
                </p>
                <p className="text-sm text-gray-600">
                  Network: {getNetworkName(chainId)}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">
                    Balance: {balance
                      ? `${parseFloat(balance).toFixed(4)} ${
                          chainId === '0x13882' ? 'MATIC' :
                          chainId === '0x7a69' ? 'TEST tokens' :
                          chainId === '0x7a6a' ? 'Wrapped TEST tokens' : 'ETH'}`
                      : 'Click to fetch'}
                  </p>

                  <button
                    onClick={handleFetchBalance}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Not connected</p>
            )}
          </div>

          <button
            onClick={account ? disconnectWallet : connectWallet}
            className={`px-4 py-2 rounded-md ${
              account
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {account ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>

        {account && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => switchChain('0xaa36a7')}
              className={`px-4 py-2 rounded-md ${
                chainId === '0xaa36a7'
                  ? 'bg-purple-100 text-purple-800 border border-purple-500'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              Switch to Sepolia
            </button>
            <button
              onClick={() => switchChain('0x13882')}
              className={`px-4 py-2 rounded-md ${
                chainId === '0x13882'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Switch to Amoy
            </button>
            <button
              onClick={() => switchChain('0x7a69')}
              className={`px-4 py-2 rounded-md ${
                chainId === '0x7a69'
                  ? 'bg-green-100 text-green-800 border border-green-500'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Switch to Local Amoy (8545)
            </button>
            <button
              onClick={() => switchChain('0x7a6a')}
              className={`px-4 py-2 rounded-md ${
                chainId === '0x7a6a'
                  ? 'bg-teal-100 text-teal-800 border border-teal-500'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              Switch to Local Sepolia (8546)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnection;
