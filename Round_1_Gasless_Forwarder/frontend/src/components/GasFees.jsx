/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const GasEstimator = () => {
  const [tokenType, setTokenType] = useState('ERC20');
  const [sourceChain, setSourceChain] = useState('sepolia');
  const [destChain, setDestChain] = useState('amoy');
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [estimates, setEstimates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chainConfig = {
    sepolia: {
      id: 11155111,
      bridgeAddress: '0x123...',
      explorer: 'https://sepolia.etherscan.io'
    },
    amoy: {
      id: 80002,
      bridgeAddress: '0x456...',
      explorer: 'https://amoy.polygonscan.com'
    }
  };

  const estimateGasFees = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Basic validation
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }
      if (sourceChain === destChain) {
        throw new Error('Source and destination chains must be different');
      }
      if (tokenType === 'ERC20' && !amount) {
        throw new Error('Amount is required for ERC20');
      }
      if (tokenType === 'ERC721' && !tokenId) {
        throw new Error('Token ID is required for ERC721');
      }

      // Mock estimation (replace with actual bridge API calls)
      const baseGas = ethers.utils.parseUnits('0.001', 'ether');
      const bridgeFee = ethers.utils.parseUnits('0.0005', 'ether');
      const securityFee = ethers.utils.parseUnits('0.0002', 'ether');
      
      setEstimates({
        sourceGas: baseGas.add(tokenType === 'ERC721' ? ethers.utils.parseUnits('0.0003', 'ether') : 0),
        bridgeFee,
        destinationGas: baseGas.mul(2),
        securityFee,
        total: baseGas.add(bridgeFee).add(securityFee).mul(2)
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cross-Chain Gas Estimator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Token Standard</label>
          <select
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="ERC20">ERC20</option>
            <option value="ERC721">ERC721</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Source Chain</label>
          <select
            value={sourceChain}
            onChange={(e) => setSourceChain(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="sepolia">Sepolia</option>
            <option value="amoy">Amoy</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Destination Chain</label>
          <select
            value={destChain}
            onChange={(e) => setDestChain(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="amoy">Amoy</option>
            <option value="sepolia">Sepolia</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Token Address
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="0x..."
          />
        </div>

        {tokenType === 'ERC20' ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter amount"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Token ID</label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter token ID"
            />
          </div>
        )}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <button
        onClick={estimateGasFees}
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-400"
      >
        {loading ? 'Calculating...' : 'Estimate Gas Fees'}
      </button>

      {estimates && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Estimated Fees</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Source Chain Gas:</span>
              <span>{ethers.utils.formatEther(estimates.sourceGas)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Bridge Fee:</span>
              <span>{ethers.utils.formatEther(estimates.bridgeFee)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Destination Gas:</span>
              <span>{ethers.utils.formatEther(estimates.destinationGas)} MATIC</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total Estimated Cost:</span>
              <span>{ethers.utils.formatEther(estimates.total)} ETH</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Note: Estimates are approximations. Actual fees may vary based on network conditions.
      </div>
    </div>
  );
};

export default GasEstimator;