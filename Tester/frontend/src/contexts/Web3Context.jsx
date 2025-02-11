import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import TestTokens from '../contracts/TestTokens.json';
import TestNFTs from '../contracts/TestNFTs.json';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [balance, setBalance] = useState(null);
  const [customTokens, setCustomTokens] = useState(() => {
    const saved = localStorage.getItem('customTokens');
    return saved ? JSON.parse(saved) : [];
  });

  const initializeProvider = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      try {
        const signer = await provider.getSigner();
        setSigner(signer);

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateBalance(accounts[0], provider);
        }
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainId);
      } catch (err) {
        console.error('Error initializing provider:', err);
      }
    }
  };

  const updateBalance = async (address, provider) => {
    if (address && provider) {
      try {
        const balance = await provider.getBalance(address);
        setBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    }
  };

  const fetchBalance = async () => {
    if (!account || !provider) return;
    try {
      const balance = await provider.getBalance(account);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    initializeProvider();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        const newAccount = accounts[0] || null;
        setAccount(newAccount);
        if (newAccount) updateBalance(newAccount, provider);
      });

      window.ethereum.on('chainChanged', (newChainId) => {
        setChainId(newChainId);
        initializeProvider();
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', setAccount);
        window.ethereum.removeListener('chainChanged', setChainId);
      };
    }
  }, []);

  useEffect(() => {
    const initializeContracts = async () => {
      if (signer) {
        try {
          // Use the deployed contract addresses directly
          const tokenAddress = "0xc351628EB244ec633d5f21fBD6621e1a683B1181";
          const nftAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

          const tokenContract = new ethers.Contract(tokenAddress, TestTokens.abi, signer);
          const nftContract = new ethers.Contract(nftAddress, TestNFTs.abi, signer);

          setTokenContract(tokenContract);
          setNftContract(nftContract);
        } catch (err) {
          console.error('Error initializing contracts:', err);
        }
      }
    };

    initializeContracts();
  }, [signer]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
        updateBalance(accounts[0], provider);
      } catch (err) {
        console.error('Error connecting wallet:', err);
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
  };

  const switchChain = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (err) {
      console.error('Error switching chain:', err);
    }
  };

  const sendToken = async (to, amount) => {
    if (!tokenContract) return;
    try {
      const tx = await tokenContract.transfer(to, ethers.parseEther(amount));
      return await tx.wait();
    } catch (err) {
      console.error('Error sending token:', err);
      throw err;
    }
  };

  const sendNFT = async (to, tokenId) => {
    if (!nftContract) return;
    try {
      const tx = await nftContract.transferFrom(account, to, tokenId);
      return await tx.wait();
    } catch (err) {
      console.error('Error sending NFT:', err);
      throw err;
    }
  };

  const value = {
    account,
    chainId,
    provider,
    signer,
    tokenContract,
    nftContract,
    balance,
    customTokens,
    connectWallet,
    disconnectWallet,
    switchChain,
    fetchBalance,
    sendToken,
    sendNFT,
    addCustomToken: (token) => setCustomTokens(prev => [...prev, token]),
    removeCustomToken: (address) => setCustomTokens(prev => prev.filter(token => token.address !== address))
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}