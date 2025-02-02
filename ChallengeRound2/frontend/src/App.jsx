import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Tab, 
  Tabs,
  AppBar,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TokenBridge from './components/TokenBridge';
import NFTBridge from './components/NFTBridge';
import ConnectWallet from './components/ConnectWallet';
import { Web3Provider } from './context/Web3Context';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Web3Provider>
        <Container maxWidth="lg">
          <Box sx={{ flexGrow: 1, mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" className='text-white'>
              Cross-Chain Bridge
            </Typography>
            
            <ConnectWallet />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="Token Bridge" />
                <Tab label="NFT Bridge" />
              </Tabs>
            </Box>

            {tabValue === 0 && <TokenBridge />}
            {tabValue === 1 && <NFTBridge />}
          </Box>
        </Container>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;