import React, { useState, useEffect, useCallback } from 'react';
import { useBridge } from '../contexts/BridgeContext';
import { ethers } from 'ethers';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';

const Bridge = () => {
  // Context hooks
  const { account, connectWallet } = useWeb3();
  const { 
    contracts, 
    networks,
    handleBridgeTransfer, 
    getBalances 
  } = useBridge();

  // Transfer state
  const [transferState, setTransferState] = useState({
    amount: '',
    receiverAddress: '',
    sourceChain: 'amoy',
    targetChain: 'sepolia',
    transferType: 'token',
    tokenId: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balances, setBalances] = useState({
    tokens: '0',
    nfts: []
  });

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setTransferState(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'sourceChain' && {
        targetChain: value === 'amoy' ? 'sepolia' : 'amoy'
      })
    }));
  };

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!account || !contracts[transferState.sourceChain]?.token) return;

    try {
      const newBalances = await getBalances(account, transferState.sourceChain);
      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError('Failed to fetch balances');
    }
  }, [account, contracts, transferState.sourceChain, getBalances]);

  // Update balances when relevant states change
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances, transferState.sourceChain, transferState.transferType]);

  // Handle transfer submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await handleBridgeTransfer(transferState);

      setSuccess('Transfer completed successfully!');
      setTransferState(prev => ({
        ...prev,
        amount: '',
        tokenId: '',
        receiverAddress: ''
      }));
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const getValidationErrors = () => {
    const errors = [];
    
    if (!account) {
      errors.push('Please connect your wallet');
    }

    if (!transferState.receiverAddress) {
      errors.push('Receiver address is required');
    } else if (!ethers.utils.isAddress(transferState.receiverAddress)) {
      errors.push('Invalid receiver address');
    }

    if (transferState.transferType === 'token') {
      if (!transferState.amount) {
        errors.push('Amount is required');
      } else if (parseFloat(transferState.amount) > parseFloat(balances.tokens)) {
        errors.push('Insufficient balance');
      }
    } else {
      if (!transferState.tokenId) {
        errors.push('Please select an NFT');
      }
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const isTransferDisabled = loading || validationErrors.length > 0;

  // Render transfer form
  const renderTransferForm = () => (
    <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
      {/* Transfer Type Selection */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Transfer Type</InputLabel>
        <Select
          value={transferState.transferType}
          onChange={handleInputChange('transferType')}
          disabled={loading}
        >
          <MenuItem value="token">Token Transfer</MenuItem>
          <MenuItem value="nft">NFT Transfer</MenuItem>
        </Select>
      </FormControl>

      {/* Token/NFT Input Fields */}
      {transferState.transferType === 'token' ? (
        <>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Balance: {balances.tokens} tokens
          </Typography>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={transferState.amount}
            onChange={handleInputChange('amount')}
            disabled={loading}
            margin="normal"
            error={parseFloat(transferState.amount) > parseFloat(balances.tokens)}
            helperText={parseFloat(transferState.amount) > parseFloat(balances.tokens) ? 
              "Insufficient balance" : ""}
          />
        </>
      ) : (
        <>
          <Typography variant="body2" sx={{ mt: 1 }}>
            NFTs Available: {balances.nfts.length}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select NFT</InputLabel>
            <Select
              value={transferState.tokenId}
              onChange={handleInputChange('tokenId')}
              disabled={loading || balances.nfts.length === 0}
            >
              {balances.nfts.map((id) => (
                <MenuItem key={id} value={id}>Token ID: {id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

      {/* Chain Selection */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Source Chain</InputLabel>
        <Select
          value={transferState.sourceChain}
          onChange={handleInputChange('sourceChain')}
          disabled={loading}
        >
          <MenuItem value="amoy">Amoy</MenuItem>
          <MenuItem value="sepolia">Sepolia</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="body2" sx={{ mt: 1 }}>
        Target Chain: {transferState.targetChain.charAt(0).toUpperCase() + 
          transferState.targetChain.slice(1)}
      </Typography>

      {/* Receiver Address */}
      <TextField
        fullWidth
        label="Receiver Address"
        value={transferState.receiverAddress}
        onChange={handleInputChange('receiverAddress')}
        disabled={loading}
        margin="normal"
        error={transferState.receiverAddress && 
          !ethers.utils.isAddress(transferState.receiverAddress)}
        helperText={transferState.receiverAddress && 
          !ethers.utils.isAddress(transferState.receiverAddress) ? 
          "Invalid address" : ""}
      />

      {/* Submit Button */}
      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        disabled={isTransferDisabled}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Transfer'}
      </Button>

      {/* Status Messages */}
      {validationErrors.map((error, index) => (
        <Alert key={index} severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ))}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', p: 3 }}>
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Cross-Chain Bridge
          </Typography>

          {!account ? (
            <Button
              fullWidth
              variant="contained"
              onClick={connectWallet}
              sx={{ mt: 2 }}
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Connected Account: {account}
              </Typography>
              {renderTransferForm()}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Bridge;