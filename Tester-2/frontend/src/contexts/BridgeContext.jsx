import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { useWeb3 } from './Web3Context';

const BridgeContext = createContext();

// Network configurations
const NETWORKS = {
    amoy: {
        chainId: '0x7A69',
        name: 'Amoy Network',
        rpcUrl: 'http://localhost:8545',
    },
    sepolia: {
        chainId: '0x7A6A',
        name: 'Sepolia Network',
        rpcUrl: 'http://localhost:8546',
    }
};

// Contract addresses
const CONTRACT_ADDRESSES = {
    amoy: {
        token: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F',
        bridge: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
        nft: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        nftBridge: ' 0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
    },
    sepolia: {
        token: '0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9',
        bridge: '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8',
        nft: '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf',
        nftBridge: '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF',
    }
};

export const BridgeProvider = ({ children }) => {
    const { provider, signer, account, chainId, switchNetwork } = useWeb3();
    
    const [contracts, setContracts] = useState({
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
    });

    const [isInitializing, setIsInitializing] = useState(false);
    const [bridgeError, setBridgeError] = useState(null);

    // Initialize contracts for a specific network
    const initializeContracts = async (networkType) => {
        try {
            if (!signer) return;

            const TokenABIToUse = networkType === 'amoy' ? TokenABI.abi : WrappedTokenABI.abi;
            const BridgeABIToUse = networkType === 'amoy' ? BridgeAmoyABI.abi : BridgeSepoliaABI.abi;
            const NFTABIToUse = networkType === 'amoy' ? NativeNFTABI.abi : WrappedNFTABI.abi;
            const BridgeNFTABIToUse = networkType === 'amoy' ? BridgeAmoyNFTABI.abi : BridgeSepoliaNFTABI.abi;

            const newContracts = {
                token: new ethers.Contract(
                    CONTRACT_ADDRESSES[networkType].token,
                    TokenABIToUse,
                    signer
                ),
                bridge: new ethers.Contract(
                    CONTRACT_ADDRESSES[networkType].bridge,
                    BridgeABIToUse,
                    signer
                ),
                nft: new ethers.Contract(
                    CONTRACT_ADDRESSES[networkType].nft,
                    NFTABIToUse,
                    signer
                ),
                nftBridge: new ethers.Contract(
                    CONTRACT_ADDRESSES[networkType].nftBridge,
                    BridgeNFTABIToUse,
                    signer
                )
            };

            setContracts(prev => ({
                ...prev,
                [networkType]: newContracts
            }));

            return newContracts;
        } catch (error) {
            console.error(`Error initializing ${networkType} contracts:`, error);
            setBridgeError(error.message);
            throw error;
        }
    };

    // Initialize contracts when wallet is connected
    useEffect(() => {
        const init = async () => {
            if (signer && !isInitializing) {
                setIsInitializing(true);
                try {
                    await Promise.all([
                        initializeContracts('amoy'),
                        initializeContracts('sepolia')
                    ]);
                } catch (error) {
                    console.error('Error initializing contracts:', error);
                } finally {
                    setIsInitializing(false);
                }
            }
        };

        init();
    }, [signer]);

    // Bridge transfer function
    const handleBridgeTransfer = async (params) => {
        const {
            amount,
            receiverAddress,
            sourceChain,
            targetChain,
            transferType,
            tokenId
        } = params;

        try {
            if (!account) {
                throw new Error('Please connect your wallet');
            }

            if (transferType === 'token') {
                const amountInWei = ethers.utils.parseEther(amount);
                
                if (sourceChain === 'amoy') {
                    // Approve tokens
                    await contracts.amoy.token.approve(
                        contracts.amoy.bridge.address,
                        amountInWei
                    );

                    // Lock tokens
                    await contracts.amoy.bridge.lock(amountInWei);

                    // Switch network
                    await switchNetwork(NETWORKS.sepolia.chainId);

                    // Release wrapped tokens
                    await contracts.sepolia.bridge.release(
                        receiverAddress,
                        amountInWei
                    );
                } else {
                    // Similar logic for Sepolia to Amoy
                    await contracts.sepolia.token.approve(
                        contracts.sepolia.bridge.address,
                        amountInWei
                    );

                    await contracts.sepolia.bridge.burn(amountInWei);
                    
                    await switchNetwork(NETWORKS.amoy.chainId);
                    
                    await contracts.amoy.bridge.unlock(
                        receiverAddress,
                        amountInWei
                    );
                }
            } else {
                // NFT transfer logic
                if (sourceChain === 'amoy') {
                    await contracts.amoy.nft.approve(
                        contracts.amoy.nftBridge.address,
                        tokenId
                    );
                    
                    await contracts.amoy.nftBridge.lock(tokenId);
                    
                    await switchNetwork(NETWORKS.sepolia.chainId);
                    
                    await contracts.sepolia.nftBridge.release(
                        receiverAddress,
                        tokenId
                    );
                } else {
                    await contracts.sepolia.nftBridge.burn(tokenId);
                    
                    await switchNetwork(NETWORKS.amoy.chainId);
                    
                    await contracts.amoy.nftBridge.unlock(
                        receiverAddress,
                        tokenId
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('Bridge transfer error:', error);
            setBridgeError(error.message);
            throw error;
        }
    };

    // Get balances for tokens and NFTs
    const getBalances = async (address, networkType) => {
        try {
            if (!contracts[networkType].token) return { tokens: '0', nfts: [] };

            const tokenBalance = await contracts[networkType].token.balanceOf(address);
            const nftBalance = await contracts[networkType].nft.balanceOf(address);
            
            // Fetch owned NFTs
            const ownedNFTs = [];
            const maxTokensToScan = 100;
            
            for (let i = 1; i <= maxTokensToScan; i++) {
                try {
                    const owner = await contracts[networkType].nft.ownerOf(i);
                    if (owner.toLowerCase() === address.toLowerCase()) {
                        ownedNFTs.push(i.toString());
                    }
                } catch (e) {
                    continue;
                }
            }

            return {
                tokens: ethers.formatEther(tokenBalance),
                nfts: ownedNFTs
            };
        } catch (error) {
            console.error('Error fetching balances:', error);
            setBridgeError(error.message);
            throw error;
        }
    };

    const value = {
        contracts,
        networks: NETWORKS,
        isInitializing,
        bridgeError,
        handleBridgeTransfer,
        getBalances,
        initializeContracts
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