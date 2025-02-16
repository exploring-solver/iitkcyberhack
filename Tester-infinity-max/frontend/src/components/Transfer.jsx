import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

const Transfer = () => {
  const { account, tokenContract, nftContract, sendToken, sendNFT } = useWeb3();
  const [transferType, setTransferType] = useState('token'); // 'token' or 'nft'
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(recipientAddress)) {
      setError('Invalid recipient address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (transferType === 'token') {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
          throw new Error('Invalid amount');
        }
        await sendToken(recipientAddress, amount);
        setSuccess(`Successfully sent ${amount} tokens to ${recipientAddress}`);
      } else {
        if (!tokenId || isNaN(tokenId)) {
          throw new Error('Invalid token ID');
        }
        await sendNFT(recipientAddress, tokenId);
        setSuccess(`Successfully sent NFT #${tokenId} to ${recipientAddress}`);
      }

      // Clear form
      setRecipientAddress('');
      setAmount('');
      setTokenId('');
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Assets</h2>

      <div className="mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setTransferType('token')}
            className={`px-4 py-2 rounded-md ${
              transferType === 'token'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Transfer Tokens
          </button>
          <button
            onClick={() => setTransferType('nft')}
            className={`px-4 py-2 rounded-md ${
              transferType === 'nft'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Transfer NFT
          </button>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="0x..."
            required
          />
        </div>

        {transferType === 'token' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.0"
              step="0.000001"
              min="0"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Token ID
            </label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
              min="1"
              step="1"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !account}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

export default Transfer;