// Dashboard.js
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';

const SUPPORTED_NETWORKS = {
  SEPOLIA: {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  AMOY: {
    chainId: '0x12345', // Replace with actual Amoy testnet chainId
    name: 'Amoy',
    rpcUrl: 'YOUR_AMOY_RPC_URL',
    blockExplorer: 'YOUR_AMOY_EXPLORER',
  },
};

const Dashboard = () => {
  const {
    account,
    chainId,
    accounts,
    balance,
    error,
    connectWallet,
    switchWallet,
    switchNetwork,
  } = useWallet();

  const [selectedToken, setSelectedToken] = useState('ETH');
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [transactions, setTransactions] = useState([]);

  const getTokenBalance = async () => {
    setIsLoading(true);
    try {
      // Implementation for getting specific token balance
      // This would involve interacting with the token contract
      setTokenBalance('0.00'); // Placeholder
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleNetworkSwitch = async (networkName) => {
    const network = SUPPORTED_NETWORKS[networkName];
    if (network) {
      await switchNetwork(network.chainId);
    }
  };

  const handleTokenSelect = (event) => {
    setSelectedToken(event.target.value);
  };

  const handleTransfer = async () => {
    setIsLoading(true);
    try {
      // Implementation for cross-chain transfer
      // This would involve interacting with the bridge contracts
      console.log('Transfer initiated');
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (account && selectedToken) {
      getTokenBalance();
    }
  }, [account, selectedToken]);

  return (
    <Box className="p-6">
      <Grid container spacing={3}>
        {/* Wallet Connection Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4">
                Wallet Connection
              </Typography>
              {!account ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={connectWallet}
                  className="w-full"
                >
                  Connect Wallet
                </Button>
              ) : (
                <Box>
                  <Typography>Connected Account: {account}</Typography>
                  <Typography>Balance: {balance} ETH</Typography>
                  <Select
                    value={account}
                    onChange={(e) => switchWallet(e.target.value)}
                    fullWidth
                    className="mt-2"
                  >
                    {accounts.map((acc) => (
                      <MenuItem key={acc} value={acc}>
                        {acc}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Network Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Network Selection
              </Typography>
              <Box className="space-x-2">
                {Object.keys(SUPPORTED_NETWORKS).map((network) => (
                  <Button
                    key={network}
                    variant="outlined"
                    onClick={() => handleNetworkSwitch(network)}
                    className={chainId === SUPPORTED_NETWORKS[network].chainId ? 'bg-blue-100' : ''}
                  >
                    Switch to {network}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Token Balance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Token Balance
              </Typography>
              <Select
                value={selectedToken}
                onChange={handleTokenSelect}
                fullWidth
                className="mb-4"
              >
                <MenuItem value="ETH">ETH</MenuItem>
                <MenuItem value="AMOY">AMOY</MenuItem>
                <MenuItem value="SEPOLIA">SEPOLIA</MenuItem>
              </Select>
              <Typography>
                Balance: {isLoading ? <CircularProgress size={20} /> : tokenBalance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Transfer Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Cross-Chain Transfer
              </Typography>
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  label="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleTransfer}
                  disabled={isLoading || !account}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Transfer'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Transaction History
              </Typography>
              {transactions.length === 0 ? (
                <Typography>No transactions yet</Typography>
              ) : (
                <Box>
                  {transactions.map((tx) => (
                    <Box key={tx.hash} className="p-2 border-b">
                      <Typography>Hash: {tx.hash}</Typography>
                      <Typography>Status: {tx.status}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" className="mt-4">
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;