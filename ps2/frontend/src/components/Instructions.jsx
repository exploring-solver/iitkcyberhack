import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

const Instructions = () => {
  return (
    <Paper sx={{ p: 3, my: 2 }}>
      <Typography variant="h5" gutterBottom>
        Project Setup Instructions
      </Typography>
      
      <Typography variant="h6" sx={{ mt: 2 }}>
        1. Setup Local Blockchain
      </Typography>
      <List>
        <ListItem>
          <ListItemText 
            primary="Install Ganache globally"
            secondary="npm install -g ganache"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Run Ganache"
            secondary="ganache"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Copy the first two private keys from Ganache"
            secondary="These will be used to import accounts into MetaMask"
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">
        2. MetaMask Setup
      </Typography>
      <List>
        <ListItem>
          <ListItemText 
            primary="Add Network to MetaMask"
            secondary="Network Name: Localhost 8545, RPC URL: http://127.0.0.1:8545, Chain ID: 1337, Currency Symbol: ETH"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Import the first account"
            secondary="Click 'Import Account' in MetaMask and paste the first private key"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Import the second account"
            secondary="Repeat the process with the second private key"
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">
        3. Project Setup
      </Typography>
      <List>
        <ListItem>
          <ListItemText 
            primary="Install dependencies in root directory"
            secondary="npm install"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Deploy contracts"
            secondary="truffle migrate --reset --network development"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Copy contract artifacts"
            secondary="Copy Forwarder.json and TestToken.json from build/contracts to frontend/src/contracts/"
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">
        4. Frontend Setup
      </Typography>
      <List>
        <ListItem>
          <ListItemText 
            primary="Navigate to frontend directory"
            secondary="cd frontend"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Install frontend dependencies"
            secondary="npm install"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Start development server"
            secondary="npm run dev"
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">
        5. Using the Application
      </Typography>
      <List>
        <ListItem>
          <ListItemText 
            primary="Connect both MetaMask accounts"
            secondary="Switch between accounts in MetaMask to connect both"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Initiate transfer"
            secondary="From the sender account, enter recipient address and amount, then sign the permit"
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Complete transfer"
            secondary="Switch to recipient account and execute the transfer"
          />
        </ListItem>
      </List>
    </Paper>
  );
};

export default Instructions; 