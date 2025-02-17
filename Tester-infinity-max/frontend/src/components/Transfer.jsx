/* eslint-disable no-unused-vars */
import  { useState } from 'react';
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
    <div className="p-6 bg-white shadow-lg border border-gray-200 rounded-lg">
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-900 mb-5">Transfer Assets</h2>

      {/* Transfer Type Toggle */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setTransferType('token')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            transferType === 'token'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Transfer Tokens
        </button>
        <button
          onClick={() => setTransferType('nft')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            transferType === 'nft'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Transfer NFT
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleTransfer} className="space-y-5">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            placeholder="0x..."
            required
          />
        </div>

        {/* Amount or Token ID */}
        {transferType === 'token' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Token Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              placeholder="0.0"
              step="0.000001"
              min="0"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              NFT Token ID
            </label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              placeholder="1"
              min="1"
              step="1"
              required
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !account}
          className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            loading || !account
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-2 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg">
          {success}
        </div>
      )}
    </div>
  );
};

export default Transfer;
