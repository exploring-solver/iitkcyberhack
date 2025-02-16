import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

// Etherscan configuration
const ETHERSCAN_CONFIG = {
  apiKey: import.meta.env.VITE_ETHERSCAN_API_KEY, // Replace with your API key
  networks: {
    mainnet: 'https://api.etherscan.io/api',
    ropsten: 'https://api-ropsten.etherscan.io/api',
    rinkeby: 'https://api-rinkeby.etherscan.io/api',
    goerli: 'https://api-goerli.etherscan.io/api',
    sepolia: 'https://api-sepolia.etherscan.io/api'
  }
};

// Create an API instance with default config
const etherscanApi = axios.create({
  baseURL: ETHERSCAN_CONFIG.networks.mainnet,
  timeout: 10000,
});

export function useEtherscanTransactions(config = {}) {
  const { 
    apiKey = ETHERSCAN_CONFIG.apiKey,
    network = 'sepolia',
    pageSize = 100,
    startBlock = 0
  } = config;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0');

  // Get base URL based on network
  const getBaseUrl = useCallback(() => {
    return ETHERSCAN_CONFIG.networks[network] || ETHERSCAN_CONFIG.networks.mainnet;
  }, [network]);

  const fetchTransactions = useCallback(async (address) => {
    if (!address || !apiKey) {
      setError('Missing address or API key');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current balance
      const balanceResponse = await axios.get(getBaseUrl(), {
        params: {
          module: 'account',
          action: 'balance',
          address: address,
          tag: 'latest',
          apikey: apiKey
        }
      });

      if (balanceResponse.data.status === '1') {
        setBalance(ethers.formatEther(balanceResponse.data.result));
      }

      // Fetch normal transactions
      const [normalTxResponse, internalTxResponse, erc20Response] = await Promise.all([
        // Normal transactions
        axios.get(getBaseUrl(), {
          params: {
            module: 'account',
            action: 'txlist',
            address: address,
            startblock: startBlock,
            endblock: 'latest',
            page: 1,
            offset: pageSize,
            sort: 'desc',
            apikey: apiKey
          }
        }),
        // Internal transactions
        axios.get(getBaseUrl(), {
          params: {
            module: 'account',
            action: 'txlistinternal',
            address: address,
            startblock: startBlock,
            endblock: 'latest',
            page: 1,
            offset: pageSize,
            sort: 'desc',
            apikey: apiKey
          }
        }),
        // ERC20 Token Transfer Events
        axios.get(getBaseUrl(), {
          params: {
            module: 'account',
            action: 'tokentx',
            address: address,
            startblock: startBlock,
            endblock: 'latest',
            page: 1,
            offset: pageSize,
            sort: 'desc',
            apikey: apiKey
          }
        })
      ]);

      // Process and combine transactions
      let allTxs = [];

      // Process normal transactions
      if (normalTxResponse.data.status === '1') {
        allTxs.push(...normalTxResponse.data.result.map(tx => ({
          ...tx,
          type: 'normal',
          value: ethers.formatEther(tx.value),
          gasPrice: ethers.formatEther(tx.gasPrice),
          timestamp: parseInt(tx.timeStamp)
        })));
      }

      // Process internal transactions
      if (internalTxResponse.data.status === '1') {
        allTxs.push(...internalTxResponse.data.result.map(tx => ({
          ...tx,
          type: 'internal',
          value: ethers.formatEther(tx.value),
          timestamp: parseInt(tx.timeStamp)
        })));
      }

      // Process ERC20 transfers
      if (erc20Response.data.status === '1') {
        const tokenTransactions = erc20Response.data.result.map(tx => {
          try {
            // Ensure tokenDecimal is a valid number
            const decimals = parseInt(tx.tokenDecimal);
            if (isNaN(decimals)) {
              console.warn(`Invalid decimal for token ${tx.tokenSymbol}: ${tx.tokenDecimal}`);
              return {
                ...tx,
                type: 'token',
                value: '0',
                formattedValue: 'Unknown Amount',
                timestamp: parseInt(tx.timeStamp)
              };
            }
            
            const formattedValue = ethers.formatUnits(tx.value, decimals);
            return {
              ...tx,
              type: 'token',
              value: formattedValue,
              formattedValue: `${parseFloat(formattedValue).toFixed(4)} ${tx.tokenSymbol}`,
              timestamp: parseInt(tx.timeStamp)
            };
          } catch (err) {
            console.warn(`Error processing token transaction: ${err.message}`, tx);
            return {
              ...tx,
              type: 'token',
              value: '0',
              formattedValue: 'Error Processing Amount',
              timestamp: parseInt(tx.timeStamp)
            };
          }
        });
        
        allTxs.push(...tokenTransactions);
      }

      // Sort all transactions by timestamp
      allTxs.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(allTxs);
      setError(null);
    } catch (err) {
      console.error('Error fetching from Etherscan:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, network, pageSize, startBlock, getBaseUrl]);

  return {
    fetchTransactions,
    transactions,
    loading,
    error,
    balance
  };
}