import { useState } from 'react';
import { useContractRead } from 'wagmi';
import { erc721ABI } from 'wagmi';

export const NFTGallery = () => {
  const [nftAddress, setNftAddress] = useState('');
  const [tokenIds, setTokenIds] = useState([]);
  const { data: totalSupply } = useContractRead({
    address: nftAddress,
    abi: erc721ABI,
    functionName: 'totalSupply'
  });

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">NFT Gallery</h2>
      <input
        type="text"
        value={nftAddress}
        onChange={(e) => setNftAddress(e.target.value)}
        placeholder="NFT Contract Address"
        className="w-full p-2 border rounded mb-2"
      />
      <div className="grid grid-cols-3 gap-4">
        {tokenIds.map((tokenId) => (
          <NFTCard key={tokenId} tokenId={tokenId} address={nftAddress} />
        ))}
      </div>
    </div>
  );
};