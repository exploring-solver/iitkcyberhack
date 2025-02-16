import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import { ethers } from 'ethers';

// Import ABIs
import TokenABI from '../contracts/Token.sol/Token.json';
import WrappedTokenABI from '../contracts/WrappedToken.sol/WrappedToken.json';
import BridgeAmoyABI from '../contracts/BridgeAmoy.sol/BridgeAmoy.json';
import BridgeSepoliaABI from '../contracts/BridgeSepolia.sol/BridgeSepolia.json';
import NativeNFTABI from '../contracts/NativeNFT.sol/NativeNFT.json';
import WrappedNFTABI from '../contracts/WrappedNFT.sol/WrappedNFT.json';
import BridgeAmoyNFTABI from '../contracts/BridgeAmoyNFT.sol/BridgeAmoyNFT.json';
import BridgeSepoliaNFTABI from '../contracts/BridgeSepoliaNFT.sol/BridgeSepoliaNFT.json';
import DecentralizedRelayerABI from '../contracts/DecentralizedRelayer.sol/DecentralizedRelayer.json';

import { NETWORKS, CONTRACT_ADDRESSES } from './ContractContext';
import { useRelayer } from './RelayerContext';
import { checkContractState, verifyContractInitialization } from '../utils/contractUtils';

const BridgeContext = createContext();

export const BridgeProvider = ({ children }) => {
    const { confirmTransfer } = useRelayer();
    const [state, setState] = useState({
        account: null,
        chainId: null,
        web3: null,
        isConnecting: false,
        error: null,
        success: null, // Add success state
        contracts: {
            amoy: {
                token: null,
                bridge: null,
                nft: null,
                nftBridge: null,
                relayer: null
            },
            sepolia: {
                token: null,
                bridge: null,
                nft: null,
                nftBridge: null,
                relayer: null
            }
        }
    });

    const [sourceChain, setSourceChain] = useState('amoy');
    const [targetChain, setTargetChain] = useState('sepolia');
    const [isTransferring, setIsTransferring] = useState(false);
    const [error, setError] = useState(null); // Add error state
    const [success, setSuccess] = useState(null); // Add success state

    const handleBridgeTransfer = async (transferType, amount, tokenId, receiverAddress) => {
        try {
            setIsTransferring(true);
            setError(null);
            
            const sourceContracts = state.contracts[sourceChain];
            
            // Verify contract initialization
            await verifyContractInitialization(sourceContracts);
            
            // Check contract state
            const contractState = await checkContractState(sourceContracts, state.account);
            
            if (!contractState.isRelayer && !contractState.bridgeHasRelayer) {
                throw new Error('Bridge not properly configured with relayer roles');
            }

            // Rest of your transfer logic...
            
        } catch (error) {
            console.error('Bridge transfer error:', error);
            setError(error.message);
            setIsTransferring(false);
        }
    };

    // Helper functions for monitoring
    const monitorTransferStatus = async (transferId) => {
        return new Promise((resolve, reject) => {
            const check = async () => {
                try {
                    const transfer = await state.contracts.sepolia.bridge.methods
                        .processedTransfers(transferId)
                        .call();

                    if (transfer) {
                        setSuccess('Transfer completed successfully!');
                        setIsTransferring(false);
                        resolve();
                    } else {
                        setTimeout(check, 5000);
                    }
                } catch (error) {
                    console.error('Error checking transfer status:', error);
                    setError('Failed to check transfer status');
                    setIsTransferring(false);
                    reject(error);
                }
            };
            check();
        });
    };

    const monitorRelayerConfirmations = async (transferId, relayer) => {
        return new Promise((resolve, reject) => {
            const check = async () => {
                try {
                    const [confirmations, requiredConfirmations] = await Promise.all([
                        relayer.methods.getTransferConfirmations(transferId).call(),
                        relayer.methods.requiredConfirmations().call()
                    ]);

                    console.log(`Confirmations received: ${confirmations}/${requiredConfirmations}`);

                    if (Number(confirmations) >= Number(requiredConfirmations)) {
                        setSuccess('Transfer confirmed by relayers!');
                        resolve();
                    } else {
                        setTimeout(check, 5000);
                    }
                } catch (error) {
                    console.error('Error monitoring confirmations:', error);
                    setError('Failed to monitor relayer confirmations');
                    reject(error);
                }
            };
            check();
        });
    };

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

            // Add mandatory delay after network switch
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify the switch was successful
            const currentChainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            if (currentChainId.toUpperCase() !== network.chainId.toUpperCase()) {
                throw new Error('Network switch failed');
            }

            setSourceChain(targetNetwork);
            setTargetChain(targetNetwork === 'amoy' ? 'sepolia' : 'amoy');

        } catch (error) {
            if (error.code === 4902) {
                // Network needs to be added to MetaMask
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: network.chainId,
                        chainName: network.name,
                        rpcUrls: [network.rpcUrl],
                    }],
                });
            }
            console.error('Network switch error:', error);
            throw error;
        }
    };

    // Initialize contracts and setup event listeners
    useEffect(() => {
        const initializeContracts = async (web3Instance, networkType) => {
            try {
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
                    ),
                    relayer: new web3Instance.eth.Contract(
                        DecentralizedRelayerABI.abi,
                        CONTRACT_ADDRESSES[networkType].relayer
                    )
                };

                // Verify contracts
                try {
                    const tokenSymbol = await contracts.token.methods.symbol().call();
                    console.log(`${networkType} token symbol:`, tokenSymbol);
                } catch (error) {
                    console.error(`Failed to verify ${networkType} contracts:`, error);
                }

                // Verify relayer contract
                const relayerRole = await contracts.relayer.methods.RELAYER_ROLE().call();
                const hasRole = await contracts.relayer.methods.hasRole(
                    relayerRole,
                    CONTRACT_ADDRESSES[networkType].bridge
                ).call();

                if (!hasRole) {
                    console.warn(`Bridge contract doesn't have RELAYER_ROLE on ${networkType}`);
                }

                setState(prev => ({
                    ...prev,
                    contracts: {
                        ...prev.contracts,
                        [networkType]: contracts
                    }
                }));

                return contracts;
            } catch (error) {
                console.error(`Error initializing ${networkType} contracts:`, error);
                throw error;
            }
        };

        const init = async () => {
            if (window.ethereum) {
                try {
                    // Request account access
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });

                    // Get chainId
                    const chainId = await window.ethereum.request({
                        method: 'eth_chainId'
                    });

                    // Initialize Web3
                    const web3Instance = new Web3(window.ethereum);

                    setState(prev => ({
                        ...prev,
                        account: accounts[0],
                        chainId,
                        web3: web3Instance
                    }));

                    // Initialize contracts for both networks
                    await Promise.all([
                        initializeContracts(web3Instance, 'amoy'),
                        initializeContracts(web3Instance, 'sepolia')
                    ]);

                } catch (error) {
                    console.error('Initialization error:', error);
                    setState(prev => ({
                        ...prev,
                        error: error.message
                    }));
                }
            }
        };

        init();

        // Setup event listeners
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                setState(prev => ({
                    ...prev,
                    account: accounts[0] || null
                }));
            };

            const handleChainChanged = (chainId) => {
                setState(prev => ({
                    ...prev,
                    chainId
                }));
            };

            const handleDisconnect = () => {
                setState(prev => ({
                    ...prev,
                    account: null,
                    chainId: null,
                    web3: null
                }));
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('disconnect', handleDisconnect);

            // Cleanup
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('disconnect', handleDisconnect);
            };
        }
    }, []); // Empty dependency array since this should only run once on mount

    const value = {
        ...state,
        sourceChain,
        targetChain,
        isTransferring,
        error,
        success,
        setSourceChain,
        setTargetChain,
        handleBridgeTransfer,
        switchNetwork,
        setError,
        setSuccess
    };

    return (
        <BridgeContext.Provider value={value}>
            {children}
        </BridgeContext.Provider>
    );
};

export const useBridge = () => {
    const context = useContext(BridgeContext);
    if (!context) {
        throw new Error('useBridge must be used within a BridgeProvider');
    }
    return context;
};