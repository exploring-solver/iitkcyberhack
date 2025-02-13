import { useBalance } from 'wagmi';
import { useBlockchain } from '../contexts/BlockchainContext';

export const BalanceCard = () => {
  const { address, customTokens, chain } = useBlockchain();
  
  // Native token balance (ETH/MATIC)
  const { data: nativeBalance } = useBalance({
    address,
    enabled: Boolean(address),
  });

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Balances</h2>
      
      {/* Native Token Balance */}
      <div className="mb-4">
        <h3 className="font-semibold">Native Token</h3>
        <p>
          {nativeBalance?.formatted ?? '0'} {nativeBalance?.symbol}
        </p>
      </div>

      {/* Custom Tokens */}
      <div>
        <h3 className="font-semibold mb-2">Custom Tokens</h3>
        <div className="space-y-2">
          {customTokens.map((token) => (
            <TokenBalance
              key={token.address}
              address={token.address}
              symbol={token.symbol}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// TokenBalance component for individual token balances
const TokenBalance = ({ address, symbol }) => {
  const { address: userAddress } = useBlockchain();
  const { data: balance } = useBalance({
    address: userAddress,
    token: address,
    enabled: Boolean(userAddress && address),
  });

  return (
    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
      <span>{symbol}</span>
      <span>{balance?.formatted ?? '0'}</span>
    </div>
  );
};