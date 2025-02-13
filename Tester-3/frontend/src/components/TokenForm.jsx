import React, { useState } from 'react';
import { useBlockchain } from '../contexts/Web3Context';
import { getContract } from "thirdweb";
import { getBalance } from "thirdweb/extensions/erc20";

export default function TokenForm() {
  const { client, account, addToken } = useBlockchain();
  const [tokenAddress, setTokenAddress] = useState('');
  const [balance, setBalance] = useState(null);

  const fetchBalance = async () => {
    try {
      const contract = getContract({
        client,
        address: tokenAddress,
        chain: sepolia,
      });

      const tokenBalance = await getBalance({
        contract,
        address: account.address,
      });

      setBalance(tokenBalance);
      addToken(tokenAddress);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  return (
    <div className="p-4 border rounded mt-4">
      <input
        type="text"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        placeholder="Token Contract Address"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={fetchBalance}
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
      >
        Fetch Balance
      </button>
      {balance && (
        <p className="mt-2">
          Balance: {balance.displayValue} {balance.symbol}
        </p>
      )}
    </div>
  );
}
