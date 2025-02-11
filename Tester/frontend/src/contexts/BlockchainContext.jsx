import { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useNetwork, useBalance } from 'wagmi';
import { getContract } from 'viem';

export const BlockchainContext = createContext({});

export const BlockchainProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [customTokens, setCustomTokens] = useState(() => {
    const saved = localStorage.getItem('customTokens');
    return saved ? JSON.parse(saved) : [];
  });

  // Save custom tokens to localStorage
  useEffect(() => {
    localStorage.setItem('customTokens', JSON.stringify(customTokens));
  }, [customTokens]);

  const addCustomToken = (token) => {
    setCustomTokens(prev => [...prev, token]);
  };

  const removeCustomToken = (address) => {
    setCustomTokens(prev => prev.filter(token => token.address !== address));
  };

  const value = {
    address,
    isConnected,
    chain,
    customTokens,
    addCustomToken,
    removeCustomToken
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};