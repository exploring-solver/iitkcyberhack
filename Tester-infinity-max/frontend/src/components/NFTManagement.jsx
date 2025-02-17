/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useNFTs } from '../hooks/web3Hooks';

const NFTManagement = () => {
  const { account } = useWeb3();
  const [nftAddress, setNftAddress] = useState('');
  const { nfts, loading, error } = useNFTs(nftAddress);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(nftAddress)) {
      alert('Invalid NFT contract address');
      return;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">NFT Management</h2>

      {/* NFT Contract Input */}
      <form onSubmit={handleAddressSubmit}>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="NFT Contract Address"
            value={nftAddress}
            onChange={(e) => setNftAddress(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={!account}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Fetch NFTs
          </button>
        </div>
      </form>

      {/* NFT Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading NFTs...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <NFTCard key={nft.tokenId} nft={nft} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            {nftAddress ? 'No NFTs found' : 'Enter an NFT contract address to view your NFTs'}
          </p>
        </div>
      )}
    </div>
  );
};

const NFTCard = ({ nft }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="aspect-square w-full relative">
        {nft.metadata.image ? (
          <img
            src={nft.metadata.image}
            alt={nft.metadata.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg mb-1 text-gray-900">{nft.metadata.name}</h3>
        {nft.metadata.description && (
          <p className="text-sm text-gray-600 mb-2">{nft.metadata.description}</p>
        )}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">Token ID: {nft.tokenId}</p>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
            Test NFT
          </span>
        </div>
      </div>
    </div>
  );
};

export default NFTManagement;