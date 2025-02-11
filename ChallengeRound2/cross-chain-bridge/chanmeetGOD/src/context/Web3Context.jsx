import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';

// Import ABIs
import TokenABI from '../contracts/Token.sol/Token.json';
import WrappedTokenABI from '../contracts/WrappedToken.sol/WrappedToken.json';
import BridgeAmoyABI from '../contracts/BridgeAmoy.sol/BridgeAmoy.json';
import BridgeSepoliaABI from '../contracts/BridgeSepolia.sol/BridgeSepolia.json';
import NativeNFTABI from '../contracts/NativeNFT.sol/NativeNFT.json';
import WrappedNFTABI from '../contracts/WrappedNFT.sol/WrappedNFT.json';
import BridgeAmoyNFTABI from '../contracts/BridgeAmoyNFT.sol/BridgeAmoyNFT.json';
import BridgeSepoliaNFTABI from '../contracts/BridgeSepoliaNFT.sol/BridgeSepoliaNFT.json';

const Web3Context = createContext();

// Network configurations
const NETWORKS = {
    amoy: {
        chainId: '0x7A69', // 31337 in hex for local hardhat network
        name: 'Amoy Network',
        rpcUrl: 'http://localhost:8545',
    },
    sepolia: {
        chainId: '0x7A6A', // Changed to 31338 in hex
        name: 'Sepolia Network',
        rpcUrl: 'http://localhost:8546', // Update this if using actual Sepolia testnet
    }
};

// Contract addresses - replace with your deployed addresses
const CONTRACT_ADDRESSES = {
    amoy: {
        token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        bridge: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        nft: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        nftBridge: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    },
    sepolia: {
        token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        bridge: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        nft: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        nftBridge: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    }
};

export const Web3Provider = ({ children }) => {
    // State management
    const [state, setState] = useState({
        account: null,
        chainId: null,
        web3: null,
        isConnecting: false,
        error: null,
        contracts: {
            amoy: {
                token: null,
                bridge: null,
                nft: null,
                nftBridge: null,
            },
            sepolia: {
                token: null,
                bridge: null,
                nft: null,
                nftBridge: null,
            }
        }
    });

    // Initialize contracts for a specific network
    const initializeContracts = async (web3Instance, networkType) => {
        try {
            console.log(`Initializing ${networkType} contracts with addresses:`, CONTRACT_ADDRESSES[networkType]);

            // Create contract instances using web3
            const TokenABIToUse = networkType === 'amoy' ? TokenABI.abi : WrappedTokenABI.abi;
            const BridgeABIToUse = networkType === 'amoy' ? BridgeAmoyABI.abi : BridgeSepoliaABI.abi;
            const NFTABIToUse = networkType === 'amoy' ? NativeNFTABI.abi : WrappedNFTABI.abi;
            const BridgeNFTABIToUse = networkType === 'amoy' ? BridgeAmoyNFTABI.abi : BridgeSepoliaNFTABI.abi;

            const contracts = {
                token: new web3Instance.eth.Contract(
                    TokenABIToUse,
                    CONTRACT_ADDRESSES[networkType].token
                ),
                bridge: new web3Instance.eth.Contract(
                    BridgeABIToUse,
                    CONTRACT_ADDRESSES[networkType].bridge
                ),
                nft: new web3Instance.eth.Contract(
                    NFTABIToUse,
                    CONTRACT_ADDRESSES[networkType].nft
                ),
                nftBridge: new web3Instance.eth.Contract(
                    BridgeNFTABIToUse,
                    CONTRACT_ADDRESSES[networkType].nftBridge
                )
            };

            // Verify token contract
            console.log(`Verifying ${networkType} token contract...`);
            try {
                const tokenSymbol = await contracts.token.methods.symbol().call();
                const tokenName = await contracts.token.methods.name().call();
                console.log(`Token verified - Name: ${tokenName}, Symbol: ${tokenSymbol}`);
            } catch (error) {
                console.error(`Failed to verify token contract:`, error);
                throw new Error(`Token contract verification failed: ${error.message}`);
            }

            setState(prevState => ({
                ...prevState,
                contracts: {
                    ...prevState.contracts,
                    [networkType]: contracts
                }
            }));

            return contracts;
        } catch (error) {
            console.error(`Error initializing ${networkType} contracts:`, error);
            throw error;
        }
    };

    // Connect wallet function
    const connectWallet = async () => {
        try {
            setState(prev => ({ ...prev, isConnecting: true, error: null }));

            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            // Initialize Web3
            const web3Instance = new Web3(window.ethereum);
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            // Get network ID
            const chainId = await web3Instance.eth.getChainId();
            console.log('Connected to network with chainId:', chainId);
            console.log('Connected account:', accounts[0]);

            // Initialize contracts sequentially
            try {
                console.log('Initializing Amoy contracts...');
                await initializeContracts(web3Instance, 'amoy');
            } catch (error) {
                console.error('Failed to initialize Amoy contracts:', error);
            }

            try {
                console.log('Initializing Sepolia contracts...');
                await initializeContracts(web3Instance, 'sepolia');
            } catch (error) {
                console.error('Failed to initialize Sepolia contracts:', error);
            }

            setState(prev => ({
                ...prev,
                account: accounts[0],
                chainId: chainId,
                web3: web3Instance,
                isConnecting: false
            }));

            console.log('Wallet connected successfully');
        } catch (error) {
            console.error('Wallet connection error:', error);
            setState(prev => ({
                ...prev,
                error: error.message,
                isConnecting: false
            }));
            throw error;
        }
    };

    // Switch network function
    const switchNetwork = async (targetNetwork) => {
        try {
            const network = NETWORKS[targetNetwork];
            if (!network) {
                throw new Error(`Invalid network: ${targetNetwork}`);
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }],
            });

            // Reinitialize contracts after network switch
            if (state.web3) {
                await initializeContracts(state.web3, targetNetwork);
            }

            console.log(`Switched to ${targetNetwork} network`);
        } catch (error) {
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: network.chainId,
                        chainName: network.name,
                        rpcUrls: [network.rpcUrl],
                    }],
                });
            } else {
                console.error('Network switch error:', error);
                setState(prev => ({ ...prev, error: error.message }));
                throw error;
            }
        }
    };

    // Get contract balances
    const getBalances = async (address) => {
        try {
            const balances = {
                amoy: {
                    token: '0',
                    nfts: []
                },
                sepolia: {
                    token: '0',
                    nfts: []
                }
            };

            if (state.contracts.amoy.token) {
                balances.amoy.token = await state.contracts.amoy.token.methods.balanceOf(address).call();
            }

            if (state.contracts.sepolia.token) {
                balances.sepolia.token = await state.contracts.sepolia.token.methods.balanceOf(address).call();
            }

            // Add NFT balance checks here if needed

            return balances;
        } catch (error) {
            console.error('Error fetching balances:', error);
            throw error;
        }
    };

    // Event listeners
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                setState(prev => ({ ...prev, account: accounts[0] }));
                console.log('Account changed:', accounts[0]);
            };

            const handleChainChanged = (chainId) => {
                setState(prev => ({ ...prev, chainId }));
                console.log('Chain changed:', chainId);
            };

            const handleDisconnect = () => {
                setState(prev => ({
                    ...prev,
                    account: null,
                    chainId: null,
                    web3: null
                }));
                console.log('Wallet disconnected');
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('disconnect', handleDisconnect);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('disconnect', handleDisconnect);
            };
        }
    }, []);

    const value = {
        account: state.account,
        chainId: state.chainId,
        web3: state.web3,
        contracts: state.contracts,
        isConnecting: state.isConnecting,
        error: state.error,
        connectWallet,
        switchNetwork,
        getBalances,
        networks: NETWORKS
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};