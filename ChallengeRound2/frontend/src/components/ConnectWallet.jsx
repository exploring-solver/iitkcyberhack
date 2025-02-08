import React from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Chip,
  Stack 
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

function ConnectWallet() {
  const { account, chainId, connect, disconnect } = useWeb3();

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 421613:
        return 'Amoy Testnet';
      case 11155111:
        return 'Sepolia';
      default:
        return 'Unknown Network';
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
      {!account ? (
        <Button
          variant="contained"
          color="primary"
          onClick={connect}
          startIcon={<AccountBalanceWalletIcon />}
        >
          Connect Wallet
        </Button>
      ) : (
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={getNetworkName(chainId)}
            color="primary"
            variant="outlined"
          />
          <Typography variant="body1" className='text-gray-200'>
            {formatAddress(account)}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={disconnect}
          >
            Disconnect
          </Button>
        </Stack>
      )}
    </Box>
  );
}

export default ConnectWallet;