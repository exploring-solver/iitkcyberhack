/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useTokenBalance } from '../hooks/web3Hooks';

const TokenManagement = () => {
  const { account, customTokens, addCustomToken, removeCustomToken } = useWeb3();
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenSymbol, setNewTokenSymbol] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateAndAddToken = async () => {
    if (!ethers.utils.isAddress(newTokenAddress)) {
      setError('Invalid token address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      addCustomToken({
        address: newTokenAddress,
        symbol: newTokenSymbol,
        name: newTokenName,
      });
      setNewTokenAddress('');
      setNewTokenSymbol('');
      setNewTokenName('');
    } catch (err) {
      setError('Error adding token');
      console.error('Error adding token:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 shadow-md rounded-2xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Token Management</h2>

      {/* Add New Token Form */}
      <div className="mb-8 p-5 bg-white rounded-lg shadow-inner border">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">➕ Add New Token</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Token Address"
            value={newTokenAddress}
            onChange={(e) => setNewTokenAddress(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Token Symbol"
            value={newTokenSymbol}
            onChange={(e) => setNewTokenSymbol(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Token Name"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={validateAndAddToken}
            disabled={loading || !account}
            className={`w-full px-4 py-2 text-white font-semibold rounded-lg transition-colors ${
              loading || !account
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Adding...' : 'Add Token'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      {/* Token List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">📜 Your Tokens</h3>
        <div className="space-y-4">
          {customTokens.length > 0 ? (
            customTokens.map((token) => (
              <TokenCard
                key={token.address}
                token={token}
                onRemove={() => removeCustomToken(token.address)}
              />
            ))
          ) : (
            <p className="text-gray-500 text-center">No custom tokens added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const TokenCard = ({ token, onRemove }) => {
  const { balance, loading, error } = useTokenBalance(token.address);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border flex justify-between items-center">
      <div>
        <h4 className="text-lg font-semibold">{token.name} ({token.symbol})</h4>
        <p className="text-sm text-gray-500">
          {loading ? 'Fetching balance...' : error ? 'Error loading balance' : `Balance: ${balance}`}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="px-3 py-1 text-red-600 border border-red-500 rounded-lg hover:bg-red-50 transition"
      >
        🗑️ Remove
      </button>
    </div>
  );
};

export default TokenManagement;
