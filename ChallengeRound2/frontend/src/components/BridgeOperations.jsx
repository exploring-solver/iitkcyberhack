// BridgeOperations.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    CircularProgress,
    Alert,
    Select,
    MenuItem,
} from '@mui/material';
import { useWallet } from '../context/WalletContext';

// Add your deployed contract ABIs and addresses here
const BRIDGE_CONTRACTS = {
    SEPOLIA: {
        address: 'YOUR_SEPOLIA_CONTRACT_ADDRESS',
        abi: [], // Your contract ABI
    },
    AMOY: {
        address: 'YOUR_AMOY_CONTRACT_ADDRESS',
        abi: [], // Your contract ABI
    },
};

const BridgeOperations = () => {
    const { account, signer, chainId } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sourceChain, setSourceChain] = useState('SEPOLIA');
    const [targetChain, setTargetChain] = useState('AMOY');
    const [amount, setAmount] = useState('');
    const [receipt, setReceipt] = useState(null);

    const lockTokens = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const contract = new ethers.Contract(
                BRIDGE_CONTRACTS[sourceChain].address,
                BRIDGE_CONTRACTS[sourceChain].abi,
                signer
            );

            const tx = await contract.lock(
                ethers.utils.parseEther(amount),
                BRIDGE_CONTRACTS[targetChain].address
            );

            const response = await tx.wait();

            // Create receipt
            const receipt = {
                hash: response.transactionHash,
                timestamp: new Date().toISOString(),
                sender: account,
                amount: amount,
                sourceChain,
                targetChain,
            };

            setReceipt(receipt);
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    const verifyProof = async (txHash) => {
        setIsLoading(true);
        setError(null);
        try {
            const contract = new ethers.Contract(
                BRIDGE_CONTRACTS[sourceChain].address,
                BRIDGE_CONTRACTS[sourceChain].abi,
                signer
            );

            const proof = await contract.getTransferProof(txHash);
            return proof;
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    return (
        <Box className="space-y-6">
            <Card>
                <CardContent>
                    <Typography variant="h6" className="mb-4">
                        Cross-Chain Bridge Operations
                    </Typography>

                    <Box className="space-y-4">
                        {/* Chain Selection */}
                        <Box className="flex space-x-4">
                            <Box className="flex-1">
                                <Typography className="mb-2">Source Chain</Typography>
                                <Select
                                    value={sourceChain}
                                    onChange={(e) => setSourceChain(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="SEPOLIA">Sepolia</MenuItem>
                                    <MenuItem value="AMOY">Amoy</MenuItem>
                                </Select>
                            </Box>

                            <Box className="flex-1">
                                <Typography className="mb-2">Target Chain</Typography>
                                <Select
                                    value={targetChain}
                                    onChange={(e) => setTargetChain(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="SEPOLIA">Sepolia</MenuItem>
                                    <MenuItem value="AMOY">Amoy</MenuItem>
                                </Select>
                            </Box>
                        </Box>

                        {/* Amount Input */}
                        <TextField
                            fullWidth
                            label="Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            helperText="Enter the amount to transfer"
                        />

                        {/* Action Buttons */}
                        <Box className="flex space-x-4">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={lockTokens}
                                disabled={isLoading || !amount || sourceChain === targetChain}
                                fullWidth
                            >
                                {isLoading ? <CircularProgress size={24} /> : 'Lock Tokens'}
                            </Button>

                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={unlockTokens}
                                disabled={isLoading || !receipt}
                                fullWidth
                            >
                                {isLoading ? <CircularProgress size={24} /> : 'Unlock Tokens'}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Transfer Receipt */}
            {receipt && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" className="mb-4">
                            Transfer Receipt
                        </Typography>
                        <Box className="space-y-2">
                            <Typography>Transaction Hash: {receipt.hash}</Typography>
                            <Typography>Timestamp: {receipt.timestamp}</Typography>
                            <Typography>Sender: {receipt.sender}</Typography>
                            <Typography>Amount: {receipt.amount}</Typography>
                            <Typography>Source Chain: {receipt.sourceChain}</Typography>
                            <Typography>Target Chain: {receipt.targetChain}</Typography>
                            <Button
                                variant="outlined"
                                onClick={() => verifyProof(receipt.hash)}
                                className="mt-4"
                            >
                                Verify Proof
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Alert severity="error" className="mt-4">
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default BridgeOperations;

const unlockTokens = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const contract = new ethers.Contract(
            BRIDGE_CONTRACTS[targetChain].address,
            BRIDGE_CONTRACTS[targetChain].abi,
            signer
        );

        const tx = await contract.unlock(
            ethers.utils.parseEther(amount),
            receipt.hash // Using the original transaction hash for verification
        );

        await tx.wait();
        setReceipt(null);
    } catch (err) {
        setError(err.message);
    }
    setIsLoading(false);
};