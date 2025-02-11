import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useTransactionHistory } from '../hooks/web3Hooks';

const TransactionHistory = () => {
  const { account } = useWeb3();
  const { transactions, loading, error, refreshTransactions } = useTransactionHistory();
  const [filter, setFilter] = useState('all'); // all, sent, received, contracts

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'sent') return tx.from.toLowerCase() === account?.toLowerCase();
    if (filter === 'received') return tx.to?.toLowerCase() === account?.toLowerCase();
    if (filter === 'contracts') return tx.data === 'Contract Interaction';
    return true;
  });

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          <button
            onClick={refreshTransactions}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Transactions</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
            <option value="contracts">Contract Interactions</option>
          </select>
        </div>
      </div>

      {loading && !transactions.length ? (
        <div className="text-center py-4">Loading transactions...</div>
      ) : error ? (
        <div className="text-red-600 py-4">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Hash</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">From</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">To</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Value</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Gas Used</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.data === 'Contract Interaction' 
                        ? 'bg-purple-100 text-purple-800'
                        : tx.from.toLowerCase() === account?.toLowerCase()
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {tx.data === 'Contract Interaction' 
                        ? 'Contract'
                        : tx.from.toLowerCase() === account?.toLowerCase() 
                        ? 'Sent' 
                        : 'Received'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {`${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    {`${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'Contract Creation'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {parseFloat(tx.value).toFixed(6)} ETH
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {tx.gasUsed ? `${tx.gasUsed} gwei` : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        tx.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.status ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-4 text-gray-600">
              No transactions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;