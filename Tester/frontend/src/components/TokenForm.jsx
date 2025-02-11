import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useBalance, useToken } from 'wagmi';

export const TokenForm = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const { addCustomToken } = useBlockchain();
  const { data: tokenInfo } = useToken({ address: tokenAddress });
  const { data: balance } = useBalance({ address: tokenAddress });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tokenInfo) {
      addCustomToken({
        address: tokenAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals
      });
      setTokenAddress('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Add Custom Token</h2>
      <input
        type="text"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        placeholder="Token Address"
        className="w-full p-2 border rounded mb-2"
      />
      <button
        type="submit"
        className="w-full p-2 bg-green-500 text-white rounded"
        disabled={!tokenInfo}
      >
        Add Token
      </button>
    </form>
  );
};