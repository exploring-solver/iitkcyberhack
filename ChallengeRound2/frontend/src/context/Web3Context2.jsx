import React, { createContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import BridgeAmoyABI from '../contracts/abis/BridgeAmoy.json';
import BridgeSepoliaABI from '../contracts/abis/BridgeSepolia.json';
import TokenABI from '../contracts/abis/Token.json';
import WrappedTokenABI from '../contracts/abis/WrappedToken.json';
import BridgeAmoyNFTABI from '../contracts/abis/BridgeAmoyNFT.json';
import BridgeSepoliaNFTABI from '../contracts/abis/BridgeSepoliaNFT.json';
import NativeNFTABI from '../contracts/abis/NativeNFT.json';
import WrappedNFTABI from '../contracts/abis/WrappedNFT.json';
import {
  BridgeAmoy,
  BridgeSepolia,
  Token,
  WrappedToken,
  NativeNFT,
  WrappedNFT,
  BridgeAmoyNFT,
  BridgeSepoliaNFT
} from '../contracts/contractAddresses';

export const Web3Context = createContext(null);

const NETWORKS = {
  AMOY: {
    chainId: '0x13882',
    chainName: 'Amoy Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-mumbai-bor.publicnode.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com']
  },
  SEPOLIA: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableNetworks, setAvailableNetworks] = useState(['AMOY', 'SEPOLIA']);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const initializeWeb3 = useCallback(async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      return web3Instance;
    }
    throw new Error('Please install MetaMask');
  }, []);

  const switchNetwork = async (networkName) => {
    try {
      setLoading(true);
      const network = NETWORKS[networkName.toUpperCase()];
      if (!network) throw new Error('Invalid network');

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
        } else {
          throw switchError;
        }
      }

      setChainId(network.chainId);
      setNetworkName(networkName);
      
      const web3Instance = await initializeWeb3();
      await initializeContracts(web3Instance, network.chainId);
    } catch (error) {
      setError(error.message);
      console.error('Network switch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeContracts = useCallback(async (web3Instance, chainId) => {
    const networkKey = chainId === '0x13882' ? 'AMOY' : chainId === '0xaa36a7' ? 'SEPOLIA' : null;
    if (!networkKey) return;

    const addresses = {
      AMOY: {
        bridge: BridgeAmoy.address,
        token: Token.address,
        bridgeNFT: BridgeAmoyNFT.address,
        nativeNFT: NativeNFT.address
      },
      SEPOLIA: {
        bridge: BridgeSepolia.address,
        token: WrappedToken.address,
        bridgeNFT: BridgeSepoliaNFT.address,
        wrappedNFT: WrappedNFT.address
      }
    }[networkKey];

    try {
      const contracts = {
        bridge: new web3Instance.eth.Contract(
          networkKey === 'AMOY' ? BridgeAmoyABI.abi : BridgeSepoliaABI.abi,
          addresses.bridge
        ),
        token: new web3Instance.eth.Contract(
          networkKey === 'AMOY' ? TokenABI.abi : WrappedTokenABI.abi,
          addresses.token
        ),
        bridgeNFT: new web3Instance.eth.Contract(
          networkKey === 'AMOY' ? BridgeAmoyNFTABI.abi : BridgeSepoliaNFTABI.abi,
          addresses.bridgeNFT
        ),
        nft: new web3Instance.eth.Contract(
          networkKey === 'AMOY' ? NativeNFTABI.abi : WrappedNFTABI.abi,
          networkKey === 'AMOY' ? addresses.nativeNFT : addresses.wrappedNFT
        )
      };

      setContracts(contracts);
      return contracts;
    } catch (error) {
      console.error('Contract initialization error:', error);
      setError('Failed to initialize contracts');
      return null;
    }
  }, []);

  const selectAccount = async (selectedAccount) => {
    try {
      setLoading(true);
      setAccount(selectedAccount);
      await initializeContracts(web3, chainId);
      setShowAccountSelector(false);
    } catch (err) {
      setError(err.message);
      console.error('Account selection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = useCallback(async (networkName = null) => {
    console.log('Attempting to connect wallet...');
    try {
      setLoading(true);
      setError(null);

      const web3Instance = await initializeWeb3();
      console.log('Web3 instance created.');

      if (networkName) {
        await switchNetwork(networkName);
      }

      const accounts = await web3Instance.eth.requestAccounts();
      console.log('Available accounts:', accounts);
      setAvailableAccounts(accounts);
      
      const chainId = await web3Instance.eth.getChainId();
      const chainIdHex = '0x' + chainId.toString(16);
      console.log('Chain ID:', chainIdHex);
      
      setChainId(chainIdHex);
      setNetworkName(chainIdHex === '0x13882' ? 'Amoy' : chainIdHex === '0xaa36a7' ? 'Sepolia' : 'Unknown');
      
      if (accounts.length > 1) {
        setShowAccountSelector(true);
      } else {
        setAccount(accounts[0]);
        await initializeContracts(web3Instance, chainIdHex);
      }
    } catch (err) {
      setError(err.message);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [initializeWeb3, initializeContracts]);

  const disconnectWallet = useCallback(() => {
    setWeb3(null);
    setAccount('');
    setChainId('');
    setNetworkName('');
    setContracts({});
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || '');
      });

      window.ethereum.on('chainChanged', async (chainId) => {
        setChainId(chainId);
        setNetworkName(chainId === '0x13882' ? 'Amoy' : chainId === '0xaa36a7' ? 'Sepolia' : 'Unknown');
        if (web3) {
          await initializeContracts(web3, chainId);
        }
      });

      return () => {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      };
    }
  }, [web3, initializeContracts]);

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        chainId,
        networkName,
        contracts,
        loading,
        error,
        availableNetworks,
        availableAccounts,
        showAccountSelector,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        selectAccount,
        setShowAccountSelector
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};