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
                const amountInWei = Web3.utils.toWei(amount, 'ether');
                
                if (sourceChain === 'amoy') {
                    // Only do the lock operation, relayer handles the release
                    const bridgeAddress = state.contracts.amoy.bridge._address;
                    
                    await state.contracts.amoy.token.methods.approve(
                        bridgeAddress,
                        amountInWei
                    ).send({ from: state.account });

                    return await state.contracts.amoy.bridge.methods.lock(amountInWei)
                        .send({ from: state.account });
                } else {
                    // Only do the burn operation, relayer handles the unlock
                    const bridgeAddress = state.contracts.sepolia.bridge._address;

                    await state.contracts.sepolia.token.methods.approve(
                        bridgeAddress,
                        amountInWei
                    ).send({ from: state.account });

                    return await state.contracts.sepolia.bridge.methods.burn(amountInWei)
                        .send({ from: state.account });
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