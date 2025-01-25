import React, { createContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import ForwarderContract from '../contracts/Forwarder.json';

export const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [forwarder, setForwarder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const accounts = await web3Instance.eth.getAccounts();
        const netId = await web3Instance.eth.net.getId();
        
        // Get contract instance
        const networkData = ForwarderContract.networks[netId];
        if (networkData) {
          const forwarderInstance = new web3Instance.eth.Contract(
            ForwarderContract.abi,
            networkData.address
          );
          setForwarder(forwarderInstance);
        } else {
          throw new Error('Contract not deployed to detected network');
        }

        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setNetworkId(netId);
        setError(null);
      } else {
        throw new Error('Please install MetaMask');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    connectWallet();
  }, [connectWallet]);

  return (
    <Web3Context.Provider
      value={{
        web3,
        account,
        networkId,
        forwarder,
        loading,
        error,
        connectWallet
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}; 