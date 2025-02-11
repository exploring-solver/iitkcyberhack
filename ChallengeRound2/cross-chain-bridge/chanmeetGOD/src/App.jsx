import React, { useState, useEffect } from 'react';
import { useWeb3 } from './context/Web3Context';
import Web3 from 'web3';
import {
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    Typography,
    Alert,
} from '@mui/material';

import { CONTRACT_ADDRESSES } from './context/ContractContext';

const App = () => {
    const { account, chainId, contracts, connectWallet, switchNetwork } = useWeb3();
    const [amount, setAmount] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [sourceChain, setSourceChain] = useState('amoy');
    const [targetChain, setTargetChain] = useState('sepolia');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Add balance display
    const [balance, setBalance] = useState('0');
    // Add this new state
    const [nftBalance, setNftBalance] = useState('0');
    // Add near your other state declarations
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    const [isTransferring, setIsTransferring] = useState(false);  // so that while transferring, fetchBalance doesnt again get executed

    // Existing states...
    const [tokenId, setTokenId] = useState(''); // New state for NFT tokenId
    const [transferType, setTransferType] = useState('token'); // 'token' or 'nft'
    const [ownedNFTs, setOwnedNFTs] = useState([]); // New state for owned NFTs

    // for transaction history
    const [transactions, setTransactions] = useState([]);
    const [isLoadingTx, setIsLoadingTx] = useState(false);

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

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    // Modified handleTransfer function
    const handleTransfer = async () => {
        try {
            setLoading(true);
            setIsTransferring(true); // Set at start of transfer so that no fetBalance or fetchNFT is accidentally called due to changing states
            resetMessages();

            if (!account) {
                throw new Error('Please connect your wallet');
            }

            if (transferType === 'token') {
                // Existing token transfer logic...
                try {
                    setLoading(true);
                    resetMessages();
            
                    if (!account) {
                        throw new Error('Please connect your wallet');
                    }
            
                    // Verify contracts are initialized
                    if (!contracts?.amoy?.token || !contracts?.amoy?.bridge || 
                        !contracts?.sepolia?.token || !contracts?.sepolia?.bridge) {
                        throw new Error('Contracts not initialized. Please check your connection.');
                    }
            
                    const amountInWei = Web3.utils.toWei(amount, 'ether');
                    
                    // Source chain is Amoy, target is Sepolia
                    if (sourceChain === 'amoy') {
                        console.log('Starting Amoy to Sepolia transfer...');
                        
                        // Get contract addresses
                        const bridgeAddress = await contracts.amoy.bridge._address;
                        console.log('Bridge address:', bridgeAddress);
            
                        // Step 1: Approve tokens
                        console.log('Approving tokens...');
                        const approveTx = await contracts.amoy.token.methods.approve(
                            bridgeAddress,
                            amountInWei
                        ).send({ from: account });
                        console.log('Tokens approved');
            
                        // Step 2: Lock tokens
                        console.log('Locking tokens...');
                        const lockTx = await contracts.amoy.bridge.methods.lock(amountInWei)
                            .send({ from: account });
                        console.log('Tokens locked');
            
                        // Step 3: Switch network to Sepolia with delay
                        console.log('Switching to Sepolia network...');
                        
                        // Add a delay before switching networks
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        try {
                            await switchNetwork('sepolia');
                            
                            // Add another delay after network switch
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Verify we're on the correct network
                            const currentChainId = await window.ethereum.request({ 
                                method: 'eth_chainId' 
                            });
                            const targetChainId = NETWORKS.sepolia.chainId;
                            
                            if (currentChainId.toUpperCase() !== targetChainId.toUpperCase()) {
                                throw new Error('Network switch failed. Please switch to Sepolia network manually.');
                            }

                            // Update source chain to match current network
                            setSourceChain('sepolia');
                            setTargetChain('amoy');
                            
                            // Step 4: Release wrapped tokens
                            console.log('Releasing wrapped tokens...');
                            const releaseTx = await contracts.sepolia.bridge.methods.release(
                                receiverAddress,
                                amountInWei
                            ).send({ from: account });
                            console.log('Wrapped tokens released');

                            // Fetch new balance on Sepolia
                            setIsTransferring(false);
                            await fetchBalance();

                        } catch (switchError) {
                            console.error('Network switch error:', switchError);
                            setError('Please switch to Sepolia network manually and try releasing tokens again.');
                            return;
                        }
                    } else {
                        // Sepolia to Amoy transfer
                        console.log('Starting Sepolia to Amoy transfer...');
                        
                        // Get contract addresses
                        const bridgeAddress = await contracts.sepolia.bridge._address;
                        console.log('Bridge address:', bridgeAddress);
                    
                        // Step 1: Approve wrapped tokens for burning
                        console.log('Approving wrapped tokens...');
                        const approveTx = await contracts.sepolia.token.methods.approve(
                            bridgeAddress,
                            amountInWei
                        ).send({ from: account });
                        console.log('Wrapped tokens approved');
                    
                        // Step 2: Burn wrapped tokens
                        console.log('Burning wrapped tokens...');
                        const burnTx = await contracts.sepolia.bridge.methods.burn(amountInWei)
                            .send({ from: account });
                        console.log('Wrapped tokens burned');
                    
                        // Step 3: Switch network to Amoy with delay
                        console.log('Switching to Amoy network...');
                        
                        // Add a delay before switching networks
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        try {
                            await switchNetwork('amoy');
                            
                            // Add another delay after network switch
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Verify we're on the correct network
                            const currentChainId = await window.ethereum.request({ 
                                method: 'eth_chainId' 
                            });
                            const targetChainId = NETWORKS.amoy.chainId;
                            
                            if (currentChainId.toUpperCase() !== targetChainId.toUpperCase()) {
                                throw new Error('Network switch failed. Please switch to Amoy network manually.');
                            }

                            // Update source chain to match current network
                            setSourceChain('amoy');
                            setTargetChain('sepolia');
                            
                            // Step 4: Unlock original tokens
                            console.log('Unlocking original tokens...');
                            const unlockTx = await contracts.amoy.bridge.methods.unlock(
                                receiverAddress,
                                amountInWei
                            ).send({ from: account });
                            console.log('Original tokens unlocked');

                            // Fetch new balance on Amoy
                            setIsTransferring(false);
                            await fetchBalance();

                        } catch (switchError) {
                            console.error('Network switch error:', switchError);
                            setError('Please switch to Amoy network manually and try unlocking tokens.');
                            return;
                        }
                    }
            
                    setSuccess('Transfer completed successfully!');
                    setAmount('');
                    setReceiverAddress('');
                    
                } catch (err) {
                    console.error('Transfer error:', err);
                    setError(err.message || 'An error occurred during transfer');
                } finally {
                    setLoading(false);
                    setIsTransferring(false); // Clear at end of transfer
                }
            } else {
                // NFT transfer logic
                if (sourceChain === 'amoy') {
                    console.log('Starting NFT transfer from Amoy to Sepolia...');
                    
                    // Step 1: Approve NFT
                    const nftContract = contracts.amoy.nft;
                    const bridgeAddress = contracts.amoy.nftBridge._address;
                    
                    console.log('Approving NFT transfer...');
                    await nftContract.methods.approve(bridgeAddress, tokenId)
                        .send({ from: account });
                    
                    // Step 2: Lock NFT
                    console.log('Locking NFT...');
                    await contracts.amoy.nftBridge.methods.lock(tokenId)
                        .send({ from: account });
                    
                    // Step 3: Switch network
                    console.log('Switching to Sepolia...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    try {
                        await switchNetwork('sepolia');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Verify network switch
                        const currentChainId = await window.ethereum.request({ 
                            method: 'eth_chainId' 
                        });
                        
                        if (currentChainId.toUpperCase() !== NETWORKS.sepolia.chainId.toUpperCase()) {
                            throw new Error('Network switch failed');
                        }

                        // Update source chain to match current network
                        setSourceChain('sepolia');
                        setTargetChain('amoy');
                        
                        // Step 4: Release NFT
                        console.log('Releasing NFT...');
                        await contracts.sepolia.nftBridge.methods.release(
                            receiverAddress,
                            tokenId
                        ).send({ from: account });
                        console.log('NFT released on Sepolia');

                        // Fetch new NFT balance on Sepolia
                        setIsTransferring(false);
                        await fetchOwnedNFTs();
                        
                    } catch (switchError) {
                        console.error('Network switch error:', switchError);
                        setError('Please switch to Sepolia network manually and complete the transfer');
                        return;
                    }
                } else {
                    console.log('Starting NFT transfer from Sepolia to Amoy...');
                    
                    // Step 1: First approve the bridge to handle the NFT
                    console.log('Approving NFT transfer...');
                    await contracts.sepolia.nft.methods.approve(
                        contracts.sepolia.nftBridge._address,
                        tokenId
                    ).send({ from: account });
                    console.log('NFT approved for bridge');
                    
                    // Step 2: Burn wrapped NFT
                    console.log('Burning wrapped NFT...');
                    await contracts.sepolia.nftBridge.methods.burn(tokenId)
                        .send({ from: account });
                    console.log('Wrapped NFT burned');
                    
                    // Step 3: Switch network
                    console.log('Switching to Amoy...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    try {
                        await switchNetwork('amoy');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Verify network switch
                        const currentChainId = await window.ethereum.request({ 
                            method: 'eth_chainId' 
                        });
                        
                        if (currentChainId.toUpperCase() !== NETWORKS.amoy.chainId.toUpperCase()) {
                            throw new Error('Network switch failed');
                        }

                        // Update source chain to match current network
                        setSourceChain('amoy');
                        setTargetChain('sepolia');
                        
                        // Step 4: Unlock original NFT
                        console.log('Unlocking NFT...');
                        await contracts.amoy.nftBridge.methods.unlock(
                            receiverAddress,
                            tokenId
                        ).send({ from: account });
                        console.log('Original NFT unlocked');

                        // Fetch new NFT balance on Amoy
                        setIsTransferring(false);
                        await fetchOwnedNFTs();
                        
                    } catch (switchError) {
                        console.error('Network switch error:', switchError);
                        setError('Please switch to Amoy network manually and complete the transfer');
                        return;
                    }
                }
            }

            setSuccess('Transfer completed successfully!');
            setAmount('');
            setTokenId('');
            setReceiverAddress('');
            
        } catch (err) {
            console.error('Transfer error:', err);
            setError(err.message || 'An error occurred during transfer');
        } finally {
            setLoading(false);
        }
    };

    const isTransferDisabled = () => {
        if (!account || !receiverAddress || loading) return true;
        
        if (transferType === 'token') {
            return !amount || !contracts?.[sourceChain]?.token || !contracts?.[sourceChain]?.bridge;
        } else {
            return !tokenId || !contracts?.[sourceChain]?.nft || !contracts?.[sourceChain]?.nftBridge;
        }
    };

    const fetchBalance = async () => {
        if (account && contracts?.[sourceChain]?.token) {

            setIsBalanceLoading(true);

            try {
                console.log('Fetching balance for:', {
                    account,
                    sourceChain,
                    tokenContract: contracts[sourceChain].token
                });
                
                // Only switch networks if we're not in the middle of a transfer
                if (!isTransferring) {
                    const currentChainId = await window.ethereum.request({ 
                        method: 'eth_chainId' 
                    });
                    
                    const expectedChainId = NETWORKS[sourceChain].chainId.toUpperCase();
                    const actualChainId = currentChainId.toUpperCase();
                    
                    if (actualChainId !== expectedChainId) {
                        try {
                            await switchNetwork(sourceChain);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (switchError) {
                            console.error('Network switch error in fetchBalance:', switchError);
                            setBalance('0');
                            return;
                        }
                    }
                }
                
                // Now fetch balance
                const tokenAddress = contracts[sourceChain].token._address;
                console.log('Token contract address:', tokenAddress);
                
                const balance = await contracts[sourceChain].token.methods.balanceOf(account).call();
                console.log('Raw balance:', balance);
                setBalance(Web3.utils.fromWei(balance, 'ether'));
            } catch (err) {
                console.error('Error fetching balance:', err);
                setBalance('0');
            } finally {
                setIsBalanceLoading(false);
            }
        }
    };

    const fetchOwnedNFTs = async () => {
        if (!account || !contracts?.[sourceChain]?.nft) return;

        setIsBalanceLoading(true);
        
        try {
            console.log('Fetching NFTs for:', {
                account,
                sourceChain,
                nftContract: contracts[sourceChain].nft
            });
    
            // Only switch networks if we're not in the middle of a transfer
            if (!isTransferring) {
                const currentChainId = await window.ethereum.request({ 
                    method: 'eth_chainId' 
                });
                
                const expectedChainId = NETWORKS[sourceChain].chainId.toUpperCase();
                const actualChainId = currentChainId.toUpperCase();
                
                if (actualChainId !== expectedChainId) {
                    try {
                        await switchNetwork(sourceChain);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (switchError) {
                        console.error('Network switch error in fetchOwnedNFTs:', switchError);
                        setNftBalance('0');
                        setOwnedNFTs([]);
                        return;
                    }
                }
            }
    
            const nftContract = contracts[sourceChain].nft;
            
            // First get the balance
            const balance = await nftContract.methods.balanceOf(account).call();
            setNftBalance(balance);
            console.log('NFT balance:', balance);
    
            // Since we don't have ERC721Enumerable, we'll scan a reasonable range
            const maxTokensToScan = 100; // Adjust this number based on your expected maximum NFTs
            const ownedTokens = [];
            
            for (let i = 1; i <= maxTokensToScan; i++) {
                try {
                    const owner = await nftContract.methods.ownerOf(i).call();
                    if (owner.toLowerCase() === account.toLowerCase()) {
                        ownedTokens.push(i.toString());
                        
                        // If we found all NFTs owned by the user, we can stop scanning
                        if (ownedTokens.length >= parseInt(balance)) {
                            break;
                        }
                    }
                } catch (e) {
                    // Token might have been burned or not exist
                    continue;
                }
            }
            
            console.log('Owned NFTs:', ownedTokens);
            setOwnedNFTs(ownedTokens);
        } catch (error) {
            console.error('Error fetching owned NFTs:', error);
            setNftBalance('0');
            setOwnedNFTs([]);
        } finally {
            setIsBalanceLoading(false);
        }
    };

    const fetchTransactionHistory = async () => {
        if (!account || !contracts) return;
        
        setIsLoadingTx(true);
        try {
            // Get all relevant events from the contracts
            const fetchEvents = async (contract, eventName) => {
                try {
                    return await contract.getPastEvents(eventName, {
                        fromBlock: 0,
                        toBlock: 'latest'
                    });
                } catch (error) {
                    console.error(`Error fetching ${eventName} events:`, error);
                    return [];
                }
            };
    
            let allEvents = [];
    
            if (sourceChain === 'amoy') {
                // Fetch token events
                const lockEvents = await fetchEvents(contracts.amoy.bridge, 'Locked');
                const unlockEvents = await fetchEvents(contracts.amoy.bridge, 'Unlocked');
                
                // Fetch NFT events
                const nftLockEvents = await fetchEvents(contracts.amoy.nftBridge, 'Locked');
                const nftUnlockEvents = await fetchEvents(contracts.amoy.nftBridge, 'Unlocked');
                const mintEvents = await fetchEvents(contracts.amoy.nftBridge, 'Minted');
    
                allEvents = [
                    ...lockEvents.map(e => ({ ...e, type: 'Token Lock' })),
                    ...unlockEvents.map(e => ({ ...e, type: 'Token Unlock' })),
                    ...nftLockEvents.map(e => ({ ...e, type: 'NFT Lock' })),
                    ...nftUnlockEvents.map(e => ({ ...e, type: 'NFT Unlock' })),
                    ...mintEvents.map(e => ({ ...e, type: 'NFT Mint' }))
                ];
            } else {
                // Fetch Sepolia events
                const releaseEvents = await fetchEvents(contracts.sepolia.bridge, 'Released');
                const burnEvents = await fetchEvents(contracts.sepolia.bridge, 'Burned');
                
                // Fetch NFT events
                const nftReleaseEvents = await fetchEvents(contracts.sepolia.nftBridge, 'Released');
                const nftBurnEvents = await fetchEvents(contracts.sepolia.nftBridge, 'Burned');
    
                allEvents = [
                    ...releaseEvents.map(e => ({ ...e, type: 'Token Release' })),
                    ...burnEvents.map(e => ({ ...e, type: 'Token Burn' })),
                    ...nftReleaseEvents.map(e => ({ ...e, type: 'NFT Release' })),
                    ...nftBurnEvents.map(e => ({ ...e, type: 'NFT Burn' }))
                ];
            }
    
            // Filter events for the current user
            const userEvents = allEvents.filter(event => 
                event.returnValues.user?.toLowerCase() === account.toLowerCase()
            );
    
            // Format transactions
            const formattedTxs = userEvents.map(event => ({
                hash: event.transactionHash,
                blockNumber: event.blockNumber,
                type: event.type,
                amount: event.returnValues.amount || event.returnValues.tokenId,
                eventName: event.event
            }));
    
            // Sort by block number (descending)
            formattedTxs.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
    
            setTransactions(formattedTxs);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoadingTx(false);
        }
    };

    // Token balance useEffect
    useEffect(() => {
        const init = async () => {
            if (account && contracts?.[sourceChain]?.token && transferType === 'token') {
                await new Promise(resolve => setTimeout(resolve, 500));
                await fetchBalance();
            }
        };
        
        init();
    }, [account, sourceChain, contracts, transferType]); 

    // NFT balance useEffect
    useEffect(() => {
        const init = async () => {
            if (account && contracts?.[sourceChain]?.nft && transferType === 'nft') {
                await new Promise(resolve => setTimeout(resolve, 500));
                await fetchOwnedNFTs();
            }
        };
        
        init();
    }, [account, sourceChain, contracts, transferType]); 

    // Transaction History useEffect
    useEffect(() => {
        if (account) {
            fetchTransactionHistory();
        }
    }, [account, sourceChain]);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Card className="max-w-2xl mx-auto">
                <CardContent>
                    <Typography variant="h4" className="mb-6">
                        Cross-Chain Bridge
                    </Typography>

                    {!account ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={connectWallet}
                            className="mb-4"
                        >
                            Connect Wallet
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <Typography variant="body1">
                                Connected Account: {account}
                            </Typography>

                            <FormControl fullWidth className="mb-4">
                                <InputLabel>Transfer Type</InputLabel>
                                <Select
                                    value={transferType}
                                    onChange={async (e) => {
                                        const newTransferType = e.target.value;
                                        setTransferType(newTransferType);
                                        
                                        // Add a small delay before fetching balance
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        
                                        // Fetch the appropriate balance based on new transfer type
                                        if (newTransferType === 'token') {
                                            await fetchBalance();
                                        } else {
                                            await fetchOwnedNFTs();
                                        }
                                    }}
                                    disabled={isBalanceLoading}
                                >
                                    <MenuItem value="token">Token Transfer</MenuItem>
                                    <MenuItem value="nft">NFT Transfer</MenuItem>
                                </Select>
                            </FormControl>

                            {transferType === 'token' ? (
                                // Existing token transfer UI...
                                <>
                                    <Typography variant="body2">
                                        Balance on {sourceChain}: {isBalanceLoading ? (
                                            <span style={{ color: '#666' }}>Loading...</span>
                                        ) : (
                                            `${balance} tokens`
                                        )}
                                    </Typography>
                                    
                                    <TextField
                                        fullWidth
                                        label="Amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        type="number"
                                        className="mb-4"
                                        error={Number(amount) > Number(balance) && !isTransferring}
                                        helperText={Number(amount) > Number(balance) && !isTransferring ? "Insufficient balance" : ""}
                                        disabled={isBalanceLoading}
                                    />
                                </>
                            ) : (
                                // NFT transfer UI
                                <>
                                    <Typography variant="body2" className="mb-2">
                                        NFT Balance on {sourceChain}: {isBalanceLoading ? (
                                            <span style={{ color: '#666' }}>Loading...</span>
                                        ) : (
                                            `${nftBalance} NFTs`
                                        )}
                                    </Typography>
                                    
                                    {isBalanceLoading ? (
                                        <Alert severity="info" className="mb-4">
                                            Loading NFTs...
                                        </Alert>
                                    ) : ownedNFTs.length > 0 ? (
                                        <>
                                            <Typography variant="body2" className="mb-2">
                                                Your NFTs:
                                            </Typography>
                                            
                                            <FormControl fullWidth className="mb-4">
                                                <InputLabel>Select NFT</InputLabel>
                                                <Select
                                                    value={tokenId}
                                                    onChange={(e) => setTokenId(e.target.value)}
                                                    disabled={isBalanceLoading}
                                                >
                                                    {ownedNFTs.map((id) => (
                                                        <MenuItem key={id} value={id}>
                                                            Token ID: {id}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </>
                                    ) : (
                                        <Alert severity="info" className="mb-4">
                                            You don't own any NFTs on {sourceChain}
                                        </Alert>
                                    )}
                                </>
                            )}

                            <FormControl fullWidth className="mb-4">
                                <InputLabel>Source Chain</InputLabel>
                                <Select
                                    value={sourceChain}
                                    onChange={async (e) => {
                                        const newSourceChain = e.target.value;
                                        setSourceChain(newSourceChain);
                                        setTargetChain(newSourceChain === 'amoy' ? 'sepolia' : 'amoy');
                                        
                                        // Add a small delay before fetching balance
                                        await new Promise(resolve => setTimeout(resolve, 500));

                                        // Only fetch relevant balance based on transfer type
                                        if (transferType === 'token') {
                                            await fetchBalance();
                                        } else {
                                            await fetchOwnedNFTs();
                                        }
                                    }}
                                    disabled={isBalanceLoading}
                                >
                                    <MenuItem value="amoy">Amoy</MenuItem>
                                    <MenuItem value="sepolia">Sepolia</MenuItem>
                                </Select>
                            </FormControl>

                            <Typography variant="body2" className="mb-2">
                                Target Chain: {targetChain.charAt(0).toUpperCase() + targetChain.slice(1)}
                            </Typography>

                            <TextField
                                fullWidth
                                label="Receiver Address"
                                value={receiverAddress}
                                onChange={(e) => setReceiverAddress(e.target.value)}
                                className="mb-4"
                                error={receiverAddress && !Web3.utils.isAddress(receiverAddress)}
                                helperText={receiverAddress && !Web3.utils.isAddress(receiverAddress) ? "Invalid address" : ""}
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleTransfer}
                                disabled={isTransferDisabled()}
                                fullWidth
                            >
                                {loading ? 'Processing...' : 'Transfer'}
                            </Button>

                            {error && (
                                <Alert severity="error" className="mt-4">
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert severity="success" className="mt-4">
                                    {success}
                                </Alert>
                            )}
                        </div>
                    )}
                    {/* Transaction History */}
                    {account && (
                        <div className="mt-8">
                            <Typography variant="h6" className="mb-4">
                                Transaction History
                            </Typography>
                            
                            {isLoadingTx ? (
                                <Alert severity="info">Loading transactions...</Alert>
                            ) : transactions.length > 0 ? (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <Card key={tx.hash} className="p-4 bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <Typography variant="subtitle2">
                                                        {tx.type}
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        {tx.type.includes('NFT') ? 
                                                            `TokenID: ${tx.amount}` : 
                                                            `Amount: ${Web3.utils.fromWei(tx.amount || '0', 'ether')}`
                                                        }
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        Block: {tx.blockNumber}
                                                    </Typography>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Alert severity="info">No transactions found on {sourceChain}</Alert>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

};

export default App;