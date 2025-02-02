import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import Token from '../contracts/abis/Token.json';
import WrappedToken from '../contracts/abis/WrappedToken.json';
import BridgeAmoy from '../contracts/abis/BridgeAmoy.json';
import BridgeSepolia from '../contracts/abis/BridgeSepolia.json';


const Web3Context = createContext();

const AMOY_CHAIN_ID = 421613;
const SEPOLIA_CHAIN_ID = 11155111;

const networkConfigs = {
  [AMOY_CHAIN_ID]: {
    chainId: '0x66EC5',
    chainName: 'Amoy Testnet',
    rpcUrls: ['https://amoy.rpc.endpoint'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  [SEPOLIA_CHAIN_ID]: {
    chainId: '0xAA36A7',
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.rpc.endpoint'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [web3Modal, setWeb3Modal] = useState(null);
  const [tokenBalances, setTokenBalances] = useState({
    native: '0',
    wrapped: '0',
  });
  const [contracts, setContracts] = useState({
    token: null,
    wrappedToken: null,
    bridgeAmoy: null,
    bridgeSepolia: null,
  });

  // Initialize contracts based on addresses
  const initializeContracts = (signer, addresses) => {
    const { tokenAddress, wrappedTokenAddress, bridgeAmoyAddress, bridgeSepoliaAddress } = addresses;
    
    setContracts({
      token: new ethers.Contract(tokenAddress, Token.abi, signer),
      wrappedToken: new ethers.Contract(wrappedTokenAddress, WrappedToken.abi, signer),
      bridgeAmoy: new ethers.Contract(bridgeAmoyAddress, BridgeAmoy.abi, signer),
      bridgeSepolia: new ethers.Contract(bridgeSepoliaAddress, BridgeSepolia.abi, signer),
    });
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexValue(targetChainId) }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfigs[targetChainId]],
        });
      }
    }
  };

  // Update token balances
  const updateBalances = async () => {
    if (!account || !contracts.token || !contracts.wrappedToken) return;

    try {
      const nativeBalance = await contracts.token.balanceOf(account);
      const wrappedBalance = await contracts.wrappedToken.balanceOf(account);

      setTokenBalances({
        native: ethers.utils.formatEther(nativeBalance),
        wrapped: ethers.utils.formatEther(wrappedBalance),
      });
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  // Bridge tokens from Amoy to Sepolia
  const bridgeToSepolia = async (amount) => {
    if (chainId !== AMOY_CHAIN_ID) {
      await switchNetwork(AMOY_CHAIN_ID);
    }

    const amountWei = ethers.utils.parseEther(amount);
    
    // First approve the bridge contract
    const approveTx = await contracts.token.approve(
      contracts.bridgeAmoy.address,
      amountWei
    );
    await approveTx.wait();

    // Then lock the tokens
    const lockTx = await contracts.bridgeAmoy.lock(amountWei);
    await lockTx.wait();

    // Update balances after bridge
    await updateBalances();
  };

  // Bridge tokens from Sepolia to Amoy
  const bridgeToAmoy = async (amount) => {
    if (chainId !== SEPOLIA_CHAIN_ID) {
      await switchNetwork(SEPOLIA_CHAIN_ID);
    }

    const amountWei = ethers.utils.parseEther(amount);

    // First approve the bridge contract
    const approveTx = await contracts.wrappedToken.approve(
      contracts.bridgeSepolia.address,
      amountWei
    );
    await approveTx.wait();

    // Then burn the tokens
    const burnTx = await contracts.bridgeSepolia.burn(amountWei);
    await burnTx.wait();

    // Update balances after bridge
    await updateBalances();
  };

  useEffect(() => {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    });
    setWeb3Modal(web3Modal);
  }, []);

  useEffect(() => {
    if (account && contracts.token) {
      updateBalances();
    }
  }, [account, chainId, contracts.token]);

  const connect = async (addresses) => {
    try {
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setAccount(account);
      setChainId(network.chainId);

      // Initialize contracts with addresses
      initializeContracts(signer, addresses);

      // Subscribe to accounts change
      instance.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
      });

      // Subscribe to chainId change
      instance.on("chainChanged", (chainId) => {
        setChainId(parseInt(chainId, 16));
      });
    } catch (error) {
      console.error(error);
    }
  };

  const disconnect = async () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
      setAccount(null);
      setChainId(null);
      setProvider(null);
      setContracts({
        token: null,
        wrappedToken: null,
        bridgeAmoy: null,
        bridgeSepolia: null,
      });
      setTokenBalances({
        native: '0',
        wrapped: '0',
      });
    }
  };

  return (
    <Web3Context.Provider value={{
      account,
      chainId,
      provider,
      connect,
      disconnect,
      tokenBalances,
      bridgeToSepolia,
      bridgeToAmoy,
      switchNetwork,
      AMOY_CHAIN_ID,
      SEPOLIA_CHAIN_ID,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}