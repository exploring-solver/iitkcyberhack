import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

// Import your ABIs and contract addresses
import {
  BRIDGE_AMOY_NFT_ADDRESS,
  BRIDGE_SEPOLIA_NFT_ADDRESS,
  NATIVE_NFT_ADDRESS,
  WRAPPED_NFT_ADDRESS
} from './config';
import BridgeAmoyNFT from '../contracts/abis/BridgeAmoyNFT.json';
import BridgeSepoliaNFT from '../contracts/abis/BridgeSepoliaNFT.json';
import NativeNFT from '../contracts/abis/NativeNFT.json';
import WrappedNFT from '../contracts/abis/WrappedNFT.json';


function NFTBridge() {
  const { account, provider } = useWeb3();
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLock = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(NATIVE_NFT_ADDRESS, NativeNFT.abi, signer);
      const bridgeContract = new ethers.Contract(BRIDGE_AMOY_NFT_ADDRESS, BridgeAmoyNFT.abi, signer);

      // First approve the bridge contract
      const approveTx = await nftContract.approve(BRIDGE_AMOY_NFT_ADDRESS, tokenId);
      await approveTx.wait();

      // Then lock the NFT
      const lockTx = await bridgeContract.lock(tokenId);
      await lockTx.wait();

      setSuccess('NFT locked successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const signer = provider.getSigner();
      const bridgeContract = new ethers.Contract(BRIDGE_SEPOLIA_NFT_ADDRESS, BridgeSepoliaNFT.abi, signer);

      const burnTx = await bridgeContract.burn(tokenId);
      await burnTx.wait();

      setSuccess('NFT burned successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Bridge NFTs
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Token ID"
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleLock}
              disabled={!account || loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Lock NFT (Amoy)'}
            </Button>

            <Button
              variant="contained"
              onClick={handleBurn}
              disabled={!account || loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Burn NFT (Sepolia)'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default NFTBridge;