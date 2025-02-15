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

            if (transferType === 'token') {
                const amountInWei = Web3.utils.toWei(amount, 'ether').toString();
                console.log('Amount in Wei:', amountInWei);

                if (sourceChain === 'amoy') {
                    const bridgeAddress = state.contracts.amoy.bridge._address;
                    console.log('Bridge Address:', bridgeAddress);
                    console.log(state.contracts.amoy.token.methods);
                    // Add try-catch for detailed error logging
                    try {
                        // Get current allowance
                        const currentAllowance = await state.contracts.amoy.token.methods
                            .allowance(state.account, bridgeAddress)
                            .call();
                        console.log('Current allowance:', currentAllowance);

                        if (BigInt(currentAllowance) < BigInt(amountInWei)) {
                            console.log('Estimating approve gas...');
                            const approveGasEstimate = await state.contracts.amoy.token.methods
                                .approve(bridgeAddress, amountInWei)
                                .estimateGas({ from: state.account });

                            const approveGasWithBuffer = Math.floor(Number(approveGasEstimate) * 1.2);
                            console.log('Approve gas estimate with buffer:', approveGasWithBuffer);

                            console.log('Sending approve transaction...');
                            await state.contracts.amoy.token.methods
                                .approve(bridgeAddress, amountInWei)
                                .send({
                                    from: state.account,
                                    gas: approveGasWithBuffer
                                });
                        }

                        // Get gas estimate for lock
                        console.log('Estimating lock gas...');
                        const lockGasEstimate = await state.contracts.amoy.bridge.methods
                            .lock(amountInWei)
                            .estimateGas({
                                from: state.account,
                                value: '0'
                            });

                        const lockGasWithBuffer = Math.floor(Number(lockGasEstimate) * 1.2);
                        console.log('Lock gas estimate with buffer:', lockGasWithBuffer);

                        // Execute lock with buffered gas
                        console.log('Executing lock transaction...');
                        return await state.contracts.amoy.bridge.methods
                            .lock(amountInWei)
                            .send({
                                from: state.account,
                                gas: lockGasWithBuffer,
                                value: '0'
                            });
                    } catch (error) {
                        console.error('Detailed transaction error:', error);
                        if (error.message.includes('insufficient funds')) {
                            throw new Error('Insufficient funds to complete the transaction');
                        }
                        throw error;
                    }
                } else {
                    const bridgeAddress = state.contracts.sepolia.bridge._address;

                    try {
                        const currentAllowance = await state.contracts.sepolia.token.methods
                            .allowance(state.account, bridgeAddress)
                            .call();

                        if (BigInt(currentAllowance) < BigInt(amountInWei)) {
                            const approveGasEstimate = await state.contracts.sepolia.token.methods
                                .approve(bridgeAddress, amountInWei)
                                .estimateGas({ from: state.account });

                            const approveGasWithBuffer = Math.floor(Number(approveGasEstimate) * 1.2);

                            await state.contracts.sepolia.token.methods
                                .approve(bridgeAddress, amountInWei)
                                .send({
                                    from: state.account,
                                    gas: approveGasWithBuffer
                                });
                        }

                        const burnGasEstimate = await state.contracts.sepolia.bridge.methods
                            .burn(amountInWei)
                            .estimateGas({
                                from: state.account,
                                value: '0'
                            });

                        const burnGasWithBuffer = Math.floor(Number(burnGasEstimate) * 1.2);

                        return await state.contracts.sepolia.bridge.methods
                            .burn(amountInWei)
                            .send({
                                from: state.account,
                                gas: burnGasWithBuffer,
                                value: '0'
                            });
                    } catch (error) {
                        console.error('Detailed transaction error:', error);
                        if (error.message.includes('insufficient funds')) {
                            throw new Error('Insufficient funds to complete the transaction');
                        }
                        throw error;
                    }
                }
            } else {
                // NFT transfer logic
                if (sourceChain === 'amoy') {
                    const bridgeAddress = state.contracts.amoy.nftBridge._address;

                    await state.contracts.amoy.nft.methods.approve(
                        bridgeAddress,
                        tokenId
                    ).send({ from: state.account });

                    await state.contracts.amoy.nftBridge.methods.lock(tokenId)
                        .send({ from: state.account });

                    // Add a delay before switching networks
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await switchNetwork('sepolia');

                    // Add a delay after switching networks
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await state.contracts.sepolia.nftBridge.methods.release(
                        receiverAddress,
                        tokenId
                    ).send({ from: state.account });
                } else {
                    await state.contracts.sepolia.nft.methods.approve(
                        state.contracts.sepolia.nftBridge._address,
                        tokenId
                    ).send({ from: state.account });

                    await state.contracts.sepolia.nftBridge.methods.burn(tokenId)
                        .send({ from: state.account });

                    // Add a delay before switching networks
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await switchNetwork('amoy');

                    // Add a delay after switching networks
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await state.contracts.amoy.nftBridge.methods.unlock(
                        receiverAddress,
                        tokenId
                    ).send({ from: state.account });
                }
            }

            return true;
        } catch (error) {
            console.error('Bridge transfer error:', error);
            throw error;
        } finally {
            setIsTransferring(false);
        }
    };

    // Update the switchNetwork function
    const switchNetwork = async (targetNetwork) => {
        try {
            const network = NETWORKS[targetNetwork];
            if (!network) {
                throw new Error(`Invalid network: ${targetNetwork}`);
            }

            // Add mutex to prevent concurrent network switches
            if (window.isNetworkSwitching) {
                throw new Error('Network switch already in progress');
            }
            window.isNetworkSwitching = true;

            // Check current chain first
            const currentChainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            // Only switch if needed
            if (currentChainId.toLowerCase() !== network.chainId.toLowerCase()) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: network.chainId }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: network.chainId,
                                chainName: network.name,
                                rpcUrls: [network.rpcUrl],
                                nativeCurrency: network.nativeCurrency,
                                blockExplorerUrls: [network.blockExplorer]
                            }],
                        });
                    } else {
                        throw switchError;
                    }
                }

                // Wait for network switch to complete
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        cleanup();
                        reject(new Error('Network switch timeout'));
                    }, 10000);

                    const handleChainChanged = (chainId) => {
                        if (chainId.toLowerCase() === network.chainId.toLowerCase()) {
                            cleanup();
                            resolve();
                        }
                    };

                    const cleanup = () => {
                        clearTimeout(timeout);
                        window.ethereum.removeListener('chainChanged', handleChainChanged);
                    };

                    window.ethereum.on('chainChanged', handleChainChanged);
                });
            }

            setSourceChain(targetNetwork);
            setTargetChain(targetNetwork === 'amoy' ? 'sepolia' : 'amoy');

            return true;
        } catch (error) {
            console.error('Network switch error:', error);
            throw error;
        } finally {
            window.isNetworkSwitching = false;
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