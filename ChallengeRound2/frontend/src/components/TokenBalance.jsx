// TokenBalance.js
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';

// ERC20 Token ABI - minimum required for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// Token addresses for different networks
const TOKENS = {
  SEPOLIA: {
    ETH: 'native',
    // Add your token addresses here
    TOKEN1: '0xYourToken1Address',
    TOKEN2: '0xYourToken2Address',
  },
  AMOY: {
    ETH: 'native',
    // Add your token addresses here
    TOKEN1: '0xYourToken1Address',
    TOKEN2: '0xYourToken2Address',
  },
};

const TokenBalance = () => {
  const { account, provider, chainId } = useWallet();
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentNetwork = () => {
    switch (chainId) {
      case '0xaa36a7':
        return 'SEPOLIA';
      case '0x12345': // Replace with actual Amoy chainId
        return 'AMOY';
      default:
        return null;
    }
  };

  const fetchBalance = async () => {
    if (!account || !provider) return;

    setIsLoading(true);
    setError(null);

    try {
      const network = getCurrentNetwork();
      if (!network) {
        throw new Error('Unsupported network');
      }

      const tokenAddress = TOKENS[network][selectedToken];

      if (tokenAddress === 'native') {
        // Fetch native token (ETH) balance
        const balance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(balance));
      } else {
        // Fetch ERC20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          provider
        );

        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(account),
          tokenContract.decimals(),
        ]);

        setBalance(ethers.utils.formatUnits(balance, decimals));
      }
    } catch (err) {
      setError(err.message);
      setBalance(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [account, provider, selectedToken, chainId]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" className="mb-4">
          Token Balance
        </Typography>

        <Box className="space-y-4">
          <Select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            fullWidth
            disabled={isLoading}
          >
            <MenuItem value="ETH">ETH</MenuItem>
            <MenuItem value="TOKEN1">Token 1</MenuItem>
            <MenuItem value="TOKEN2">Token 2</MenuItem>
          </Select>

          <Box className="mt-4">
            {isLoading ? (
              <CircularProgress size={24} />
            ) : balance ? (
              <Typography variant="h5">
                {balance} {selectedToken}
              </Typography>
            ) : (
              <Typography color="textSecondary">
                No balance available
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" className="mt-4">
              {error}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TokenBalance;