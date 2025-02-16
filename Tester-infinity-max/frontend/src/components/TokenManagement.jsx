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

      // Add token to list
      addCustomToken({
        address: newTokenAddress,
        symbol: newTokenSymbol,
        name: newTokenName
      });

      // Clear form
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
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Token Management</h2>

      {/* Add New Token Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-md font-medium text-gray-700 mb-3">Add New Token</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Token Address"
            value={newTokenAddress}
            onChange={(e) => setNewTokenAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Token Symbol"
            value={newTokenSymbol}
            onChange={(e) => setNewTokenSymbol(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Token Name"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <button
            onClick={validateAndAddToken}
            disabled={loading || !account}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Token'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </div>

      {/* Token List */}
      <div>
        <h3 className="text-md font-medium text-gray-700 mb-3">Your Tokens</h3>
        <div className="space-y-3">
          {customTokens.map((token) => (
            <TokenCard
              key={token.address}
              token={token}
              onRemove={() => removeCustomToken(token.address)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TokenCard = ({ token, onRemove }) => {
  const { balance, loading, error } = useTokenBalance(token.address);

  return (
    <div className="p-3 border rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{token.name}</h4>
          <p className="text-sm text-gray-600">{token.symbol}</p>
          <p className="text-sm text-gray-600">
            {loading ? 'Loading...' : error ? 'Error loading balance' : `Balance: ${balance}`}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default TokenManagement;