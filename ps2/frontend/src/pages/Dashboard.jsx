import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Web3Context } from '../context/Web3Context';
import TransactionHistory from '../components/TransactionHistory';
import { isAddress } from 'web3-utils';

const transactionTypes = [
  { value: 'erc20', label: 'ERC-20 Transfer' },
  { value: 'erc721', label: 'ERC-721 Transfer' },
];

export default function Dashboard() {
  const { web3, account, forwarder, loading: web3Loading } = useContext(Web3Context);
  const [formData, setFormData] = useState({
    type: 'erc20',
    tokenAddress: '',
    recipient: '',
    amount: '',
    tokenId: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    if (!isAddress(formData.tokenAddress)) {
      newErrors.tokenAddress = 'Invalid token address';
    }
    if (!isAddress(formData.recipient)) {
      newErrors.recipient = 'Invalid recipient address';
    }
    if (formData.type === 'erc20' && (!formData.amount || formData.amount <= 0)) {
      newErrors.amount = 'Invalid amount';
    }
    if (formData.type === 'erc721' && (!formData.tokenId || formData.tokenId < 0)) {
      newErrors.tokenId = 'Invalid token ID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const estimateGas = async () => {
    if (!validateForm()) return;

    try {
      const data = formData.type === 'erc20' 
        ? forwarder.methods.forwardERC20Transfer(
            formData.tokenAddress,
            account,
            formData.recipient,
            formData.amount
          ).encodeABI()
        : forwarder.methods.forwardERC721Transfer(
            formData.tokenAddress,
            account,
            formData.recipient,
            formData.tokenId
          ).encodeABI();

      const gasEstimate = await web3.eth.estimateGas({
        from: account,
        to: forwarder._address,
        data
      });

      const gasPrice = await web3.eth.getGasPrice();
      const estimatedCost = web3.utils.fromWei(
        (gasEstimate * gasPrice).toString(),
        'ether'
      );

      setGasEstimate({
        gas: gasEstimate,
        cost: estimatedCost
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Gas estimation failed: ${error.message}`
      });
    }
  };

  useEffect(() => {
    if (formData.tokenAddress && formData.recipient) {
      estimateGas();
    }
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const method = formData.type === 'erc20'
        ? forwarder.methods.forwardERC20Transfer(
            formData.tokenAddress,
            account,
            formData.recipient,
            formData.amount
          )
        : forwarder.methods.forwardERC721Transfer(
            formData.tokenAddress,
            account,
            formData.recipient,
            formData.tokenId
          );

      await method.send({ from: account });

      setStatus({
        type: 'success',
        message: 'Transaction submitted successfully!'
      });
      setFormData({
        type: 'erc20',
        tokenAddress: '',
        recipient: '',
        amount: '',
        tokenId: '',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (web3Loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Send Gasless Transaction
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Transaction Type"
                      name="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {transactionTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Token Address"
                      name="tokenAddress"
                      value={formData.tokenAddress}
                      onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Recipient Address"
                      name="recipient"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    />
                  </Grid>
                  {formData.type === 'erc20' ? (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Token ID"
                        name="tokenId"
                        type="number"
                        value={formData.tokenId}
                        onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
                      />
                    </Grid>
                  )}
                  {gasEstimate && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Estimated Gas: {gasEstimate.gas} (~{gasEstimate.cost} ETH)
                    </Typography>
                  )}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      type="submit"
                      disabled={loading || !account}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Submit Transaction'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
              {status.message && (
                <Alert severity={status.type} sx={{ mt: 2 }}>
                  {status.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <TransactionHistory />
        </Grid>
      </Grid>
    </Box>
  );
} 