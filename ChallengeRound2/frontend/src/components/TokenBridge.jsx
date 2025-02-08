import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { AnimatePresence } from 'framer-motion';

// Import your ABIs and contract addresses here
import { 
  BRIDGE_AMOY_ADDRESS,
  BRIDGE_SEPOLIA_ADDRESS,
  TOKEN_ADDRESS,
  WRAPPED_TOKEN_ADDRESS
} from './config';
import BridgeAmoy from '../contracts/abis/BridgeAmoy.json';
import BridgeSepolia from '../contracts/abis/BridgeSepolia.json';
import Token from '../contracts/abis/Token.json';
import WrappedToken from '../contracts/abis/WrappedToken.json';

const StyledCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const GlowingButton = styled(Button)`
  position: relative;
  overflow: hidden;
  background: linear-gradient(45deg, #6d28d9, #7c3aed);
  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 70%
    );
    transform: rotate(45deg);
    animation: glowingEffect 3s infinite;
  }
  @keyframes glowingEffect {
    0% { transform: rotate(45deg) translateX(-100%); }
    100% { transform: rotate(45deg) translateX(100%); }
  }
`;

function TokenBridge() {
  const { 
    account, 
    chainId, 
    tokenBalances,
    provider,
    AMOY_CHAIN_ID,
    SEPOLIA_CHAIN_ID
  } = useWeb3();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add token address states
  const [amoyTokenAddress, setAmoyTokenAddress] = useState('');
  const [sepoliaTokenAddress, setSepoliaTokenAddress] = useState('');
  const [amoyBridgeAddress, setAmoyBridgeAddress] = useState('');
  const [sepoliaBridgeAddress, setSepoliaBridgeAddress] = useState('');

  const handleBridgeToSepolia = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const signer = provider.getSigner();
      
      // Get contract instances
      const token = new ethers.Contract(amoyTokenAddress, [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint256)"
      ], signer);
      
      const bridge = new ethers.Contract(amoyBridgeAddress, [
        "function lock(uint256 amount) external"
      ], signer);

      // Approve tokens
      const amountWei = ethers.utils.parseEther(amount);
      const approveTx = await token.approve(bridge.address, amountWei);
      await approveTx.wait();
      setSuccess('Token approval successful. Proceeding with lock...');

      // Lock tokens
      const lockTx = await bridge.lock(amountWei);
      await lockTx.wait();
      
      // Get updated balance
      const balance = await token.balanceOf(account);
      
      setSuccess(`Tokens locked successfully! Current balance: ${ethers.utils.formatEther(balance)} tokens`);
      setAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBridgeToAmoy = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const signer = provider.getSigner();
      
      // Get contract instances
      const token = new ethers.Contract(sepoliaTokenAddress, [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint256)"
      ], signer);
      
      const bridge = new ethers.Contract(sepoliaBridgeAddress, [
        "function burn(uint256 amount) external"
      ], signer);

      // Approve and burn tokens
      const amountWei = ethers.utils.parseEther(amount);
      const approveTx = await token.approve(bridge.address, amountWei);
      await approveTx.wait();
      setSuccess('Token approval successful. Proceeding with burn...');

      const burnTx = await bridge.burn(amountWei);
      await burnTx.wait();

      // Get updated balance
      const balance = await token.balanceOf(account);
      
      setSuccess(`Tokens burned successfully! Current balance: ${ethers.utils.formatEther(balance)} tokens`);
      setAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAmoyChain = chainId === AMOY_CHAIN_ID;
  const isSepoliaChain = chainId === SEPOLIA_CHAIN_ID;

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <StyledCard
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <Typography variant="h5" gutterBottom align="center" 
          sx={{ 
            background: 'linear-gradient(45deg, #6d28d9, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
          
        >
          Cross-Chain Token Bridge
        </Typography>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom className='text-white'>
            Contract Addresses
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Amoy Token Address"
                value={amoyTokenAddress}
                onChange={(e) => setAmoyTokenAddress(e.target.value)}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Amoy Bridge Address"
                value={amoyBridgeAddress}
                onChange={(e) => setAmoyBridgeAddress(e.target.value)}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Sepolia Token Address"
                value={sepoliaTokenAddress}
                onChange={(e) => setSepoliaTokenAddress(e.target.value)}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Sepolia Bridge Address"
                value={sepoliaBridgeAddress}
                onChange={(e) => setSepoliaBridgeAddress(e.target.value)}
                fullWidth
                margin="dense"
              />
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Amoy Balance
              </Typography>
              <Typography variant="h6">
                {tokenBalances.native} TOKEN
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Sepolia Balance
              </Typography>
              <Typography variant="h6">
                {tokenBalances.wrapped} wTOKEN
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Amount to Bridge"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            fullWidth
            InputProps={{
              inputProps: { 
                min: 0,
                step: "0.000000000000000001"
              }
            }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <GlowingButton
                variant="contained"
                onClick={handleBridgeToSepolia}
                disabled={!account || loading || !isAmoyChain || !amount || !amoyTokenAddress || !amoyBridgeAddress}
                fullWidth
                startIcon={<SwapHorizIcon />}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Lock on Amoy'
                )}
              </GlowingButton>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                onClick={handleBridgeToAmoy}
                disabled={!account || loading || !isSepoliaChain || !amount || !sepoliaTokenAddress || !sepoliaBridgeAddress}
                fullWidth
                startIcon={<SwapHorizIcon />}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Burn on Sepolia'
                )}
              </Button>
            </Grid>
          </Grid>

          {account && !isAmoyChain && !isSepoliaChain && (
            <Alert severity="warning">
              Please switch to either Amoy or Sepolia network to use the bridge.
            </Alert>
          )}
          
          {account && amount && isAmoyChain && (
            <Alert severity="info">
              This will lock {amount} tokens on Amoy and mint wrapped tokens on Sepolia.
            </Alert>
          )}
          
          {account && amount && isSepoliaChain && (
            <Alert severity="info">
              This will burn {amount} wrapped tokens on Sepolia and unlock tokens on Amoy.
            </Alert>
          )}
        </Box>
      </motion.div>
    </StyledCard>
  );
}

export default TokenBridge;