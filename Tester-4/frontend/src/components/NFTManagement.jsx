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
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">NFT Management</h2>

      {/* NFT Contract Input */}
      <form onSubmit={handleAddressSubmit} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="NFT Contract Address"
            value={nftAddress}
            onChange={(e) => setNftAddress(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            type="submit"
            disabled={!account}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Fetch NFTs
          </button>
        </div>
      </form>

      {/* NFT Display */}
      {loading ? (
        <div className="text-center py-4">Loading NFTs...</div>
      ) : error ? (
        <div className="text-red-600 py-4">{error}</div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <NFTCard key={nft.tokenId} nft={nft} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-600">
          {nftAddress ? 'No NFTs found' : 'Enter an NFT contract address to view your NFTs'}
        </div>
      )}
    </div>
  );
};

const NFTCard = ({ nft }) => {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow hover:shadow-md transition-shadow">
      <div className="aspect-square w-full relative">
        {nft.metadata.image ? (
          <img
            src={nft.metadata.image}
            alt={nft.metadata.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-lg">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg mb-1">{nft.metadata.name}</h3>
        {nft.metadata.description && (
          <p className="text-sm text-gray-600 mb-2">{nft.metadata.description}</p>
        )}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">Token ID: {nft.tokenId}</p>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            Test NFT
          </span>
        </div>
      </div>
    </div>
  );
};

export default NFTManagement;