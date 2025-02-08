// WalletContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      
      const signer = provider.getSigner();
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const balance = await provider.getBalance(accounts[0]);

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setAccounts(accounts);
      setChainId(chainId);
      setBalance(ethers.utils.formatEther(balance));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setAccounts([]);
    setBalance(null);
  };

  const switchWallet = async (newAccount) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }],
      });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const balance = await provider.getBalance(newAccount);

      setAccount(newAccount);
      setProvider(provider);
      setSigner(signer);
      setBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      setError(err.message);
    }
  };

  const switchNetwork = async (networkId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkId }],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (newAccounts) => {
        setAccounts(newAccounts);
        setAccount(newAccounts[0]);
      });

      window.ethereum.on('chainChanged', (newChainId) => {
        setChainId(newChainId);
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        accounts,
        balance,
        error,
        connectWallet,
        disconnectWallet,
        switchWallet,
        switchNetwork
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);