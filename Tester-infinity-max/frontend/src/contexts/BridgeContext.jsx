import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';

// Import ABIs
import TokenABI from '../contracts/Token.sol/Token.json';
import WrappedTokenABI from '../contracts/WrappedToken.sol/WrappedToken.json';
import BridgeAmoyABI from '../contracts/BridgeAmoyV2.sol/BridgeAmoyV2.json';
import BridgeSepoliaABI from '../contracts/BridgeSepoliaV2.sol/BridgeSepoliaV2.json';
import NativeNFTABI from '../contracts/NFT.sol/NFT.json';
import WrappedNFTABI from '../contracts/WrappedNFT.sol/WrappedNFT.json';
import BridgeAmoyNFTABI from '../contracts/BridgeAmoyNFTV2.sol/BridgeAmoyNFTV2.json';
import BridgeSepoliaNFTABI from '../contracts/BridgeSepoliaNFTV2.sol/BridgeSepoliaNFTV2.json';

import { NETWORKS, CONTRACT_ADDRESSES } from './ContractContext';

const BridgeContext = createContext();

export const BridgeProvider = ({ children }) => {
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

    const [sourceChain, setSourceChain] = useState('amoy');
    const [targetChain, setTargetChain] = useState('sepolia');
    const [isTransferring, setIsTransferring] = useState(false);

    const handleBridgeTransfer = async (transferType, amount, tokenId, receiverAddress) => {
        try {
            setIsTransferring(true);
    
            if (!state.account) {
                throw new Error('Please connect your wallet');
            }
    
            // Helper function for getting the appropriate Web3 instance
            const getWeb3ForNetwork = (network) => {
                const rpcUrl = network === 'amoy' 
                    ? import.meta.env.VITE_AMOY_RPC_URL 
                    : import.meta.env.VITE_SEPOLIA_RPC_URL;
                
                return new Web3(new Web3.providers.HttpProvider(rpcUrl));
            };
    
            // Helper function for sending transactions
            const sendTransaction = async (contract, method, network, options = {}) => {
                try {
                    const web3Instance = getWeb3ForNetwork(network);
                    const gasPrice = await web3Instance.eth.getGasPrice();
                    const gasEstimate = await method.estimateGas({ 
                        from: state.account, 
                        ...options 
                    });
    
                    return method.send({
                        from: state.account,
                        gas: Math.ceil(Number(gasEstimate) * 1.2),
                        gasPrice: gasPrice,
                        maxPriorityFeePerGas: null,
                        maxFeePerGas: null,
                        ...options
                    });
                } catch (error) {
                    console.error(`Transaction error on ${network}:`, error);
                    throw error;
                }
            };
    
            if (transferType === 'token') {
                const amountInWei = Web3.utils.toWei(amount, 'ether');
                
                if (sourceChain === 'amoy') {
                    // Amoy to Sepolia token transfer
                    const bridgeAddress = state.contracts.amoy.bridge._address;
                    
                    await sendTransaction(
                        state.contracts.amoy.token,
                        state.contracts.amoy.token.methods.approve(bridgeAddress, amountInWei),
                        'amoy'
                    );
    
                    const lockTx = await sendTransaction(
                        state.contracts.amoy.bridge,
                        state.contracts.amoy.bridge.methods.lockWithRelay(
                            amountInWei,
                            receiverAddress
                        ),
                        'amoy'
                    );
                    
                    const requestId = lockTx.events.LockRequested.returnValues.requestId;
                    await waitForTransferCompletion(requestId, 'sepolia', 'token');
                    
                } else {
                    // Sepolia to Amoy token transfer
                    const bridgeAddress = state.contracts.sepolia.bridge._address;
    
                    await sendTransaction(
                        state.contracts.sepolia.token,
                        state.contracts.sepolia.token.methods.approve(bridgeAddress, amountInWei),
                        'sepolia'
                    );
    
                    const burnTx = await sendTransaction(
                        state.contracts.sepolia.bridge,
                        state.contracts.sepolia.bridge.methods.burnWithRelay(
                            amountInWei,
                            receiverAddress
                        ),
                        'sepolia'
                    );
                    
                    const requestId = burnTx.events.ReleaseRequested.returnValues.requestId;
                    await waitForTransferCompletion(requestId, 'amoy', 'token');
                }
            } else if (transferType === 'nft') {
                if (sourceChain === 'amoy') {
                    // Amoy to Sepolia NFT transfer
                    const bridgeAddress = state.contracts.amoy.nftBridge._address;
                    
                    // Approve NFT
                    await sendTransaction(
                        state.contracts.amoy.nft,
                        state.contracts.amoy.nft.methods.approve(bridgeAddress, tokenId),
                        'amoy'
                    );
    
                    // Lock NFT with relay
                    const lockTx = await sendTransaction(
                        state.contracts.amoy.nftBridge,
                        state.contracts.amoy.nftBridge.methods.lockWithRelay(
                            tokenId,
                            receiverAddress
                        ),
                        'amoy'
                    );
    
                    const requestId = lockTx.events.LockRequested.returnValues.requestId;
                    await waitForTransferCompletion(requestId, 'sepolia', 'nft');
    
                } else {
                    // Sepolia to Amoy NFT transfer
                    const bridgeAddress = state.contracts.sepolia.nftBridge._address;
    
                    // Approve NFT
                    await sendTransaction(
                        state.contracts.sepolia.nft,
                        state.contracts.sepolia.nft.methods.approve(bridgeAddress, tokenId),
                        'sepolia'
                    );
    
                    // Burn NFT with relay
                    const burnTx = await sendTransaction(
                        state.contracts.sepolia.nftBridge,
                        state.contracts.sepolia.nftBridge.methods.burnWithRelay(
                            tokenId,
                            receiverAddress
                        ),
                        'sepolia'
                    );
    
                    const requestId = burnTx.events.ReleaseRequested.returnValues.requestId;
                    await waitForTransferCompletion(requestId, 'amoy', 'nft');
                }
            }
    
            return true;
        } catch (error) {
            console.error('Bridge transfer error:', {
                message: error.message,
                code: error.code,
                data: error.data,
                stack: error.stack
            });
            throw error;
        } finally {
            setIsTransferring(false);
        }
    };
    
    // Helper function to wait for transfer completion
    const waitForTransferCompletion = async (requestId, targetChain, type) => {
        return new Promise((resolve, reject) => {
            const targetContract = targetChain === 'sepolia' 
                ? (type === 'token' ? state.contracts.sepolia.bridge : state.contracts.sepolia.nftBridge)
                : (type === 'token' ? state.contracts.amoy.bridge : state.contracts.amoy.nftBridge);
    
            const timeoutId = setTimeout(() => {
                reject(new Error('Transfer timeout - check target chain manually'));
            }, 300000); // 5 minute timeout
    
            const eventName = targetChain === 'sepolia' ? 'TransferExecuted' : 'TransferExecuted';
            targetContract.events[eventName]({
                filter: { requestId: requestId }
            })
            .on('data', (event) => {
                clearTimeout(timeoutId);
                resolve(event);
            })
            .on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    };

    const verifyNetwork = async (targetNetwork) => {
        try {
            const network = NETWORKS[targetNetwork];
            if (!network) {
                throw new Error(`Invalid network: ${targetNetwork}`);
            }
    
            try {
                // First try switching to the network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: network.chainId }],
                });
                return { success: true };
            } catch (error) {
                // Network needs to be added
                if (error.code === 4902 || 
                    error.code === -32603 || 
                    error.message.includes('wallet_addEthereumChain')) {
                    
                    try {
                        // Add the network
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: network.chainId,
                                chainName: network.chainName,
                                nativeCurrency: network.nativeCurrency,
                                rpcUrls: network.rpcUrls,
                                blockExplorerUrls: network.blockExplorerUrls
                            }],
                        });
                        
                        // Return with instructions for manual switch
                        return { 
                            success: false,
                            needsManualSwitch: true,
                            networkName: network.chainName,
                            userMessage: `Network "${network.chainName}" has been added successfully. Please switch to it manually and refresh the page.`,
                        };
                    } catch (addError) {
                        return { 
                            success: false, 
                            error: addError.message,
                            userMessage: 'Failed to add network. Please try again.'
                        };
                    }
                }
                return { 
                    success: false, 
                    error: error.message,
                    userMessage: 'Unable to switch network. Please try again.'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                userMessage: 'Network verification failed. Please try again.'
            };
        }
    };

    const switchNetwork = async (targetNetwork) => {
        const result = await verifyNetwork(targetNetwork);
        
        if (!result.success) {
            console.error('Network switch error:', result.error);
            const error = new Error(result.userMessage);
            // Attach networkConfig to the error object
            error.networkConfig = result.networkConfig;
            throw error;
        }
    
        // Add delay after successful switch
        await new Promise(resolve => setTimeout(resolve, 2000));
    
        // Update UI state
        setSourceChain(targetNetwork);
        setTargetChain(targetNetwork === 'amoy' ? 'sepolia' : 'amoy');
    
        return result;
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
                    )
                };

                // Verify contracts
                try {
                    const tokenSymbol = await contracts.token.methods.symbol().call();
                    console.log(`${networkType} token symbol:`, tokenSymbol);
                } catch (error) {
                    console.error(`Failed to verify ${networkType} contracts:`, error);
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
        setSourceChain,
        setTargetChain,
        handleBridgeTransfer,
        switchNetwork
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