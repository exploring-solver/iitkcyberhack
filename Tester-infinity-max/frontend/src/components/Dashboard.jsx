import React from 'react';
import WalletConnection from './WalletConnection';
import TokenManagement from './TokenManagement';
import NFTManagement from './NFTManagement';
import TransactionHistory from './TransactionHistory';
import Transfer from './Transfer';
import { useWeb3 } from '../contexts/Web3Context';
import Bridge from './Bridge';

const Dashboard = () => {
  const { account } = useWeb3();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Blockchain Testing DApp</h1>
            </div>
            {account && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600">
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Wallet Connection Section */}
          <section>
            <WalletConnection />
          </section>

          {account ? (
            <>
              {/* Transfer Section */}
              <section>
                <Transfer />
              </section>

              {/* Token Management Section */}
              <section>
                <TokenManagement />
              </section>
              {/* Bridge Section */}
              <section>
                <Bridge />
              </section>

              {/* NFT Management Section */}
              <section>
                <NFTManagement />
              </section>

              {/* Transaction History Section */}
              <section>
                <TransactionHistory />
              </section>
            </>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-lg text-gray-600">
                Please connect your wallet to access the dashboard
              </h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;