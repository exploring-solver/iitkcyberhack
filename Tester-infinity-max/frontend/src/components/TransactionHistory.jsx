import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useEtherscanTransactions } from '../hooks/etherscanHooks';

// Configuration object
const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY ; // Replace with your actual API key
const NETWORK = 'sepolia'; // or 'sepolia', 'goerli', etc.

const TransactionHistory = () => {
  const { account } = useWeb3();
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    fetchTransactions, 
    transactions, 
    loading, 
    error, 
    balance 
  } = useEtherscanTransactions({
    apiKey: ETHERSCAN_API_KEY,
    network: NETWORK,
    pageSize: 100
  });

  useEffect(() => {
    if (account) {
      fetchTransactions(account);
    }
  }, [account, fetchTransactions]);

  const getTransactionTypeLabel = (tx) => {
    if (tx.type === 'token') return 'Token Transfer';
    if (tx.type === 'internal') return 'Internal';
    if (tx.input !== '0x') return 'Contract';
    return 'Transfer';
  };

  const getTypeStyle = (tx) => {
    const styles = {
      'Token Transfer': 'bg-purple-100 text-purple-800',
      'Internal': 'bg-yellow-100 text-yellow-800',
      'Contract': 'bg-blue-100 text-blue-800',
      'Transfer': tx.from.toLowerCase() === account?.toLowerCase()
        ? 'bg-red-100 text-red-800'
        : 'bg-green-100 text-green-800'
    };
    return styles[getTransactionTypeLabel(tx)];
  };

  // Add a function to create a unique key for each transaction
  const getUniqueTransactionKey = (tx) => {
    // Combine multiple properties to ensure uniqueness
    return `${tx.hash}-${tx.type || 'normal'}-${tx.nonce || ''}-${tx.transactionIndex || ''}-${tx.timeStamp}`;
  };

  // Deduplicate transactions based on the unique key
  const deduplicateTransactions = (txs) => {
    const seen = new Set();
    return txs.filter(tx => {
      const key = getUniqueTransactionKey(tx);
      const isDuplicate = seen.has(key);
      seen.add(key);
      return !isDuplicate;
    });
  };

  // Filter and deduplicate transactions
  const filteredTransactions = deduplicateTransactions(
    transactions.filter(tx => {
      if (filter === 'sent') return tx.from.toLowerCase() === account?.toLowerCase();
      if (filter === 'received') return tx.to?.toLowerCase() === account?.toLowerCase();
      if (filter === 'tokens') return tx.type === 'token';
      if (filter === 'contracts') return tx.input !== '0x' && tx.type === 'normal';
      return true;
    })
  );

  // Pagination logic
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Pagination change handlers
  const handleNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  };
  
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex flex-col space-y-4">
        {/* Balance Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Current Balance</h3>
              <p className="text-2xl font-bold text-blue-700">{parseFloat(balance).toFixed(4)} ETH</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Account</p>
              <p className="text-sm font-mono text-blue-800">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <button
              onClick={() => account && fetchTransactions(account)}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Transactions</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="tokens">Token Transfers</option>
              <option value="contracts">Contract Interactions</option>
            </select>
          </div>
        </div>

        {/* Transaction Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
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
                {paginatedTransactions.map((tx) => (
                  <tr key={getUniqueTransactionKey(tx)} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(tx)}`}>
                        {getTransactionTypeLabel(tx)}
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
                      <a
                        href={`https://etherscan.io/address/${tx.from}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {`${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-sm font-mono">
                      {tx.to ? (
                        <a
                          href={`https://etherscan.io/address/${tx.to}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {`${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}
                        </a>
                      ) : (
                        'Contract Creation'
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={
                        tx.from.toLowerCase() === account?.toLowerCase()
                          ? 'text-red-600'
                          : 'text-green-600'
                      }>
                        {tx.from.toLowerCase() === account?.toLowerCase() ? '-' : '+'}
                        {tx.type === 'token' 
                          ? `${parseFloat(tx.value).toFixed(4)} ${tx.tokenSymbol}`
                          : `${parseFloat(tx.value).toFixed(6)} ETH`
                        }
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.gasUsed ? `${parseInt(tx.gasUsed).toLocaleString()} gwei` : 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          tx.isError === '0' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.isError === '0' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(tx.timestamp * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {filteredTransactions.length > 0 && (
              <div className="flex justify-between items-center mt-4 px-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p>No transactions found</p>
                <p className="text-sm mt-2">Try changing the filter or refreshing the list</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;