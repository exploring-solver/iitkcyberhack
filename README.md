# Gasless Token Transfer with EIP-2612 Permit

This project demonstrates gasless token transfers using EIP-2612 permit functionality. The sender signs a permit message, and the recipient executes the transfer, paying for the gas fees.

## Prerequisites

- Node.js and npm installed
- MetaMask browser extension
- Basic understanding of Ethereum and smart contracts

## Setup Instructions

### 1. Local Blockchain Setup

```bash
# Install Ganache globally
npm install -g ganache

# Start Ganache
ganache
```

- Copy the first two private keys displayed in the Ganache CLI output

### 2. MetaMask Setup

1. Add Local Network to MetaMask:
   - Network Name: Localhost 8545
   - New RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

2. Import Accounts:
   - Click on "Import Account" in MetaMask
   - Paste the first private key from Ganache
   - Repeat for the second private key

### 3. Project Setup

```bash
# Install dependencies
npm install

# Deploy contracts
truffle migrate --reset --network development

# Copy contract artifacts
# Copy the following files from build/contracts to frontend/src/contracts:
# - Forwarder.json
# - TestToken.json
```

Important: Note down the deployed contract addresses for:
- TestToken contract
- Forwarder contract

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Using the Application

1. Connect Accounts:
   - Connect both MetaMask accounts to the frontend
   - First account will be the sender
   - Second account will be the recipient

2. Token Transfer Process:
   - From sender account:
     - Enter recipient address
     - Enter amount of TEST tokens
     - Sign the permit
   - Switch to recipient account:
     - Execute the transfer
     - Confirm the transaction (recipient pays gas)

## Contract Addresses

After deployment, update the following addresses in your frontend configuration:

- TestToken: `<YOUR_TEST_TOKEN_ADDRESS>`
- Forwarder: `<YOUR_FORWARDER_ADDRESS>`

## Testing

```bash
# Run tests
truffle test
```

## Security Considerations

- Always verify the permit data before signing
- Check token allowances and balances
- Verify contract addresses
- Never share private keys

## Troubleshooting

1. **MetaMask Connection Issues**:
   - Ensure you're connected to the correct network
   - Reset MetaMask account if transactions are stuck

2. **Transaction Failures**:
   - Check gas limits
   - Verify token balances
   - Ensure permit hasn't expired
