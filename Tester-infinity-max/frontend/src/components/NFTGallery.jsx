import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../contexts/Web3Context';
import { getContract } from "thirdweb";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";

export default function NFTGallery() {
  const { client, account } = useBlockchain();
  const [nftAddress, setNftAddress] = useState('');
  const [nfts, setNfts] = useState([]);

  const fetchNFTs = async () => {
    try {
      const contract = getContract({
        client,
        address: nftAddress,
        chain: sepolia,
      });

      const ownedNFTs = await getOwnedNFTs({
        contract,
        address: account.address,
      });

      setNfts(ownedNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    }
  };

  return (
    <div className="p-4 border rounded mt-4">
      <input
        type="text"
        value={nftAddress}
        onChange={(e) => setNftAddress(e.target.value)}
        placeholder="NFT Contract Address"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={fetchNFTs}
        className="mt-2 px-4 py-2 bg-purple-500 text-white rounded"
      >
        Fetch NFTs
      </button>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {nfts.map((nft) => (
          <div key={nft.metadata.id} className="border rounded p-2">
            {nft.metadata.image && (
              <img
                src={nft.metadata.image}
                alt={nft.metadata.name}
                className="w-full h-auto"
              />
            )}
            <p className="mt-2">{nft.metadata.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}