/* eslint-disable react/prop-types */
import { createContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import BridgeContract from '../contracts/Bridge.json';
import TokenContract from '../contracts/Token.json';

export const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [bridge, setBridge] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkName, setNetworkName] = useState(null);

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount(null);
    setNetworkId(null);
    setBridge(null);
    setToken(null);
  };

  const connectWallet = useCallback(async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        console.log('Web3 instance created.');

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Requested accounts from MetaMask.');


        const accounts = await web3Instance.eth.getAccounts();
        console.log('Accounts found:', accounts);
        
        const netId = Number(await web3Instance.eth.net.getId());
        console.log('Network ID:', netId);
        const networkName = netId === 31337 ? "Local" : netId === 80002 ? "Amoy" : netId === 11155111 ? "Sepolia" : "Unknown";
        setNetworkName(networkName);
        // Bridge Contract
        const bridgeNetworkData = BridgeContract.networks[netId];
        const bridgeAddress = bridgeNetworkData?.address || import.meta.env.VITE_REACT_APP_BRIDGE_ADDRESS;
        if (!bridgeAddress) throw new Error(`Bridge not deployed to network ${netId}`);
        const bridgeInstance = new web3Instance.eth.Contract(BridgeContract.abi, bridgeAddress);
  
        // Token Contract
        const tokenNetworkData = TokenContract.networks[netId];
        const tokenAddress = tokenNetworkData?.address || import.meta.env.VITE_REACT_APP_TOKEN_ADDRESS;
        if (!tokenAddress) throw new Error(`Token not deployed to network ${netId}`);
        const tokenInstance = new web3Instance.eth.Contract(TokenContract.abi, tokenAddress);
  
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setNetworkId(netId);
        setBridge(bridgeInstance);
        setToken(tokenInstance);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      console.log('Setting up Ethereum event listeners...');
      
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        setAccount(accounts[0]);
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed to:', chainId, 'Reloading...');
        window.location.reload();
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
        });
        window.ethereum.removeListener('chainChanged', () => {
          window.location.reload();
        });
      };
    } else {
      console.warn('No Ethereum provider detected. MetaMask is required.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await connectWallet();
      if (isMounted) setLoading(false);
    };
    init();
    return () => { isMounted = false; };
  }, [connectWallet]);

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        networkId,
        bridge,
        token,
        loading,
        error,
        connectWallet,
        disconnectWallet,
        networkName
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};