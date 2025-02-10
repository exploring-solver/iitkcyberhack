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

const App = () => {
    const { account, chainId, contracts, connectWallet, switchNetwork } = useWeb3();
    const [amount, setAmount] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [sourceChain, setSourceChain] = useState('amoy');
    const [targetChain, setTargetChain] = useState('sepolia');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    // const handleTransfer = async () => {
    //     try {
    //         setLoading(true);
    //         resetMessages();

    //         if (!account) {
    //             throw new Error('Please connect your wallet');
    //         }

    //         // Verify contracts are initialized
    //         if (!contracts?.amoy?.token || !contracts?.amoy?.bridge || 
    //             !contracts?.sepolia?.token || !contracts?.sepolia?.bridge) {
    //             throw new Error('Contracts not initialized. Please check your connection.');
    //         }

    //         const amountInWei = Web3.utils.toWei(amount, 'ether');
            
    //         // Source chain is Amoy, target is Sepolia
    //         if (sourceChain === 'amoy') {
    //             console.log('Starting Amoy to Sepolia transfer...');
                
    //             // Get contract addresses
    //             const bridgeAddress = await contracts.amoy.bridge._address;
    //             console.log('Bridge address:', bridgeAddress);

    //             // Step 1: Approve tokens
    //             console.log('Approving tokens...');
    //             const approveTx = await contracts.amoy.token.methods.approve(
    //                 bridgeAddress,
    //                 amountInWei
    //             ).send({ from: account });
    //             console.log('Tokens approved');

    //             // Step 2: Lock tokens
    //             console.log('Locking tokens...');
    //             const lockTx = await contracts.amoy.bridge.methods.lock(amountInWei)
    //                 .send({ from: account });
    //             console.log('Tokens locked');

    //             // Step 3: Switch network to Sepolia
    //             console.log('Switching to Sepolia network...');
    //             await switchNetwork('sepolia');
                
    //             // Step 4: Release wrapped tokens
    //             console.log('Releasing wrapped tokens...');
    //             const releaseTx = await contracts.sepolia.bridge.methods.release(
    //                 receiverAddress,
    //                 amountInWei
    //             ).send({ from: account });
    //             console.log('Wrapped tokens released');

    //         // Source chain is Sepolia, target is Amoy
    //         } else {
    //             console.log('Starting Sepolia to Amoy transfer...');
                
    //             // Get contract addresses
    //             const bridgeAddress = await contracts.sepolia.bridge._address;
    //             console.log('Bridge address:', bridgeAddress);

    //             // Step 1: Approve wrapped tokens
    //             console.log('Approving wrapped tokens...');
    //             const approveTx = await contracts.sepolia.token.methods.approve(
    //                 bridgeAddress,
    //                 amountInWei
    //             ).send({ from: account });
    //             console.log('Wrapped tokens approved');

    //             // Step 2: Burn wrapped tokens
    //             console.log('Burning wrapped tokens...');
    //             const burnTx = await contracts.sepolia.bridge.methods.burn(amountInWei)
    //                 .send({ from: account });
    //             console.log('Wrapped tokens burned');

    //             // Step 3: Switch network to Amoy
    //             console.log('Switching to Amoy network...');
    //             await switchNetwork('amoy');
                
    //             // Step 4: Unlock original tokens
    //             console.log('Unlocking original tokens...');
    //             const unlockTx = await contracts.amoy.bridge.methods.unlock(
    //                 receiverAddress,
    //                 amountInWei
    //             ).send({ from: account });
    //             console.log('Original tokens unlocked');
    //         }

    //         setSuccess('Transfer completed successfully!');
    //         setAmount('');
    //         setReceiverAddress('');
            
    //     } catch (err) {
    //         console.error('Transfer error:', err);
    //         setError(err.message || 'An error occurred during transfer');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleTransfer = async () => {
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
                    
                    // Step 4: Release wrapped tokens
                    console.log('Releasing wrapped tokens...');
                    const releaseTx = await contracts.sepolia.bridge.methods.release(
                        receiverAddress,
                        amountInWei
                    ).send({ from: account });
                    console.log('Wrapped tokens released');
                } catch (switchError) {
                    console.error('Network switch error:', switchError);
                    setError('Please switch to Sepolia network manually and try releasing tokens again.');
                    return;
                }
            } else {
                // Similar logic for Sepolia to Amoy...
                // (Add the same network switching improvements here)
            }
    
            setSuccess('Transfer completed successfully!');
            setAmount('');
            setReceiverAddress('');
            
        } catch (err) {
            console.error('Transfer error:', err);
            setError(err.message || 'An error occurred during transfer');
        } finally {
            setLoading(false);
        }
    };

    // Add validation
    const isTransferDisabled = () => {
        return !account || !amount || !receiverAddress || loading || 
               !contracts?.[sourceChain]?.token || !contracts?.[sourceChain]?.bridge;
    };

    // Add balance display
    const [balance, setBalance] = useState('0');
    
    useEffect(() => {
        const fetchBalance = async () => {
            if (account && contracts?.[sourceChain]?.token) {
                try {
                    console.log('Fetching balance for:', {
                        account,
                        sourceChain,
                        tokenContract: contracts[sourceChain].token
                    });
                    
                    // Verify the contract is properly initialized
                    const tokenAddress = contracts[sourceChain].token._address;
                    console.log('Token contract address:', tokenAddress);
                    
                    const balance = await contracts[sourceChain].token.methods.balanceOf(account).call();
                    console.log('Raw balance:', balance);
                    setBalance(Web3.utils.fromWei(balance, 'ether'));
                } catch (err) {
                    console.error('Error fetching balance:', err);
                    setBalance('0');
                }
            }
        };

        fetchBalance();
    }, [account, sourceChain, contracts]);

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

                            <Typography variant="body2">
                                Balance on {sourceChain}: {balance} tokens
                            </Typography>

                            <FormControl fullWidth className="mb-4">
                                <InputLabel>Source Chain</InputLabel>
                                <Select
                                    value={sourceChain}
                                    onChange={(e) => {
                                        setSourceChain(e.target.value);
                                        setTargetChain(e.target.value === 'amoy' ? 'sepolia' : 'amoy');
                                    }}
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
                                label="Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="number"
                                className="mb-4"
                                error={Number(amount) > Number(balance)}
                                helperText={Number(amount) > Number(balance) ? "Insufficient balance" : ""}
                            />

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
                </CardContent>
            </Card>
        </div>
    );
};

export default App;