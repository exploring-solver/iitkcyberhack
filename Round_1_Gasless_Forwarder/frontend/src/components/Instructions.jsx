/* eslint-disable react/prop-types */
import {  Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

const Instructions = () => {
  return (
    <Paper sx={{ 
      p: 4, 
      my: 2,
      bgcolor: 'background.paper',
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      '& pre': {
        bgcolor: 'background.default',
        p: 2,
        borderRadius: 1,
        mt: 1,
        fontFamily: 'monospace',
        color: 'text.secondary'
      },
      minHeight: 'screen',
    }}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 700,
        color: 'text.primary',
        mb: 3,
        fontFamily: 'Inter, sans-serif'
      }}>
        Project Setup Guide
      </Typography>
      
      <SectionHeader title="1. Setup Local Blockchain" />
      <InstructionList items={[
        { primary: "Install Ganache globally", secondary: "npm install -g ganache" },
        { primary: "Run Ganache", secondary: "ganache" },
        { primary: "Copy the first two private keys from Ganache", 
          secondary: "These will be used to import accounts into MetaMask" }
      ]} />

      <SectionDivider />

      <SectionHeader title="2. MetaMask Setup" />
      <InstructionList items={[
        { primary: "Add Network to MetaMask", 
          secondary: `Network Name: Localhost 8545\nRPC URL: http://127.0.0.1:8545\nChain ID: 1337\nCurrency Symbol: ETH` },
        { primary: "Import the first account", 
          secondary: "Click 'Import Account' in MetaMask and paste the first private key" },
        { primary: "Import the second account", 
          secondary: "Repeat the process with the second private key" }
      ]} />

      <SectionDivider />

      <SectionHeader title="3. Project Setup" />
      <InstructionList items={[
        { primary: "Install dependencies in root directory", secondary: "npm install" },
        { primary: "Deploy contracts", 
          secondary: "truffle migrate --reset --network development" },
        { primary: "Copy contract artifacts", 
          secondary: "Copy Forwarder.json and TestToken.json from build/contracts to frontend/src/contracts/" }
      ]} />

      <SectionDivider />

      <SectionHeader title="4. Frontend Setup" />
      <InstructionList items={[
        { primary: "Navigate to frontend directory", secondary: "cd frontend" },
        { primary: "Install frontend dependencies", secondary: "npm install" },
        { primary: "Start development server", secondary: "npm run dev" }
      ]} />

      <SectionDivider />

      <SectionHeader title="5. Using the Application" />
      <InstructionList items={[
        { primary: "Connect both MetaMask accounts", 
          secondary: "Switch between accounts in MetaMask to connect both" },
        { primary: "Initiate transfer", 
          secondary: "From the sender account, enter recipient address and amount, then sign the permit" },
        { primary: "Complete transfer", 
          secondary: "Switch to recipient account and execute the transfer" }
      ]} />
    </Paper>
  );
};

const SectionHeader = ({ title }) => (
  <Typography variant="h6" sx={{ 
    mt: 3, 
    mb: 2,
    fontWeight: 600,
    color: 'text.primary',
    fontFamily: 'Inter, sans-serif',
    '&:first-of-type': { mt: 0 }
  }}>
    {title}
  </Typography>
);

const InstructionList = ({ items }) => (
  <List dense>
    {items.map((item, index) => (
      <ListItem key={index} sx={{ 
        py: 1.5,
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background-color 0.2s ease'
      }}>
        <ListItemText
          primary={item.primary}
          primaryTypographyProps={{ 
            variant: 'body1',
            fontWeight: 500,
            color: 'text.primary'
          }}
          secondary={item.secondary}
          secondaryTypographyProps={{ 
            component: 'div',
            variant: 'body2',
            color: 'text.secondary',
            sx: { 
              whiteSpace: 'pre-wrap',
              mt: 0.5,
              fontFamily: item.secondary.includes('npm') ? 'monospace' : 'inherit'
            }
          }}
        />
      </ListItem>
    ))}
  </List>
);

const SectionDivider = () => (
  <Divider sx={{ 
    my: 3, 
    bgcolor: 'divider',
    '&:last-of-type': { display: 'none' }
  }} />
);

export default Instructions;