# Cross-Chain Asset Transfer System

## Overview
This project implements a **Cross-Chain Asset Transfer System** where assets can be locked on one blockchain and minted as a representation on another. The system consists of smart contracts deployed on two test networks (**LocalAmoy** and **LocalSepolia**) that enable the secure transfer of ERC20 tokens and NFTs between chains.

The system ensures:
- **Security**: Assets are locked before being minted on the other chain.
- **Transparency**: Users can verify all transactions on the blockchain.
- **Proof-of-Transfer**: The transfer process is traceable on both chains.

## Project Setup and Installation

### Prerequisites
- **Node.js** (>=16.x)
- **Hardhat** (Ethereum development framework)
- **Metamask** (for interacting with test networks)
- **Ganache** (optional for local blockchain simulation)

### Installation
```sh
# Clone the repository
git clone https://github.com/exploring-solver/iitkcyberhack.git
cd cross-chain-transfer

# Install dependencies
npm install
```

### Hardhat Local Blockchain Setup
Run two separate local blockchain nodes on different ports:
```sh
npx hardhat node --port 8545 # LocalAmoy
npx hardhat node --port 8546 # LocalSepolia
```

## Deploy Smart Contracts
### Deploy on LocalAmoy
```sh
npx hardhat run scripts/deployAmoy.js --network localAmoy
```
### Deploy on LocalSepolia
```sh
npx hardhat run scripts/deploySepolia.js --network localSepolia
```

## ERC20 Token Transfer Steps
### Step 1: Lock Tokens on LocalAmoy
```sh
npx hardhat console --network localAmoy
```
```js
const token = await ethers.getContractAt("ERC20", "<localAmoy token address>");
const bridge = await ethers.getContractAt("BridgeAmoy", "<localAmoy bridge address>");
await token.approve(bridge.target, ethers.parseEther("10"));  
await bridge.lock(ethers.parseEther("10"));
const balance = await token.balanceOf("<your_address>");
console.log(`Sender's balance on LocalAmoy: ${ethers.formatEther(balance)}`);
```

### Step 2: Release Tokens on LocalSepolia
```sh
npx hardhat console --network localSepolia
```
```js
const bridge = await ethers.getContractAt("BridgeSepolia", "<localSepolia bridge address>");
await bridge.release("<your_address>", ethers.parseEther("10"));
const token = await ethers.getContractAt("ERC20", "<localSepolia token address>");
const balance = await token.balanceOf("<your_address>");
console.log(`Receiver's balance on LocalSepolia: ${ethers.formatEther(balance)}`);
```

### Step 3: Burn Tokens on LocalSepolia
```sh
npx hardhat console --network localSepolia
```
```js
await token.approve(bridge.target, ethers.parseEther("10"));
await bridge.burn(ethers.parseEther("10"));
const balance = await token.balanceOf("<your_address>");
console.log(`Sender's balance on LocalSepolia: ${ethers.formatEther(balance)}`);
```

### Step 4: Unlock Tokens on LocalAmoy
```sh
npx hardhat console --network localAmoy
```
```js
await bridge.unlock("<your_address>", ethers.parseEther("10"));
const balance = await token.balanceOf("<your_address>");
console.log(`Receiver's balance on LocalAmoy: ${ethers.formatEther(balance)}`);
```

## NFT Transfer Steps
### Step 1: Deploy NFT Contracts
#### Deploy on LocalAmoy
```sh
npx hardhat run scripts/deployAmoyNFT.js --network localAmoy
```
#### Deploy on LocalSepolia
```sh
npx hardhat run scripts/deploySepoliaNFT.js --network localSepolia
```

### Step 2: Mint and Lock NFT on LocalAmoy
```sh
npx hardhat console --network localAmoy
```
```js
const nft = await ethers.getContractAt("NativeNFT", "<localAmoy NFT address>");
const bridge = await ethers.getContractAt("BridgeAmoyNFT", "<localAmoy bridge address>");
const [signer] = await ethers.getSigners();
const userAddress = await signer.getAddress();
await bridge.mint(userAddress); // Mint NFT with ID 1
const tokenId = 1;
await nft.approve(bridge.target, tokenId);
await bridge.lock(tokenId);
const owner = await nft.ownerOf(tokenId);
console.log(`NFT ${tokenId} owner on LocalAmoy: ${owner}`);
```

### Step 3: Release Wrapped NFT on LocalSepolia
```sh
npx hardhat console --network localSepolia
```
```js
const bridge = await ethers.getContractAt("BridgeSepoliaNFT", "<localSepolia bridge address>");
await bridge.release(userAddress, tokenId);
const wrappedNFT = await ethers.getContractAt("WrappedNFT", "<localSepolia Wrapped NFT address>");
const newOwner = await wrappedNFT.ownerOf(tokenId);
console.log(`Wrapped NFT ${tokenId} owner on LocalSepolia: ${newOwner}`);
```

## Explanation of Key Concepts
### Lock and Release Mechanism
1. **Locking**: When an asset is locked on one blockchain, it gets temporarily held by the bridge contract, preventing double spending.
2. **Minting**: A representation of the locked asset is created on the destination blockchain.
3. **Burning & Unlocking**: When the asset is burned on the second blockchain, the original asset is unlocked on the first blockchain.

### Wrapped NFT Concept
- The **WrappedNFT** is a copy of the original NFT that represents ownership on another chain.
- When the original NFT is locked, a wrapped version is minted on the second chain.
- When the wrapped NFT is burned, the original NFT is released back to its owner.

## Conclusion
This project successfully demonstrates a **cross-chain asset transfer system** using smart contracts on **LocalAmoy** and **LocalSepolia** networks. It ensures **security, transparency, and traceability** in asset transfers.

## Future Enhancements
- **Automated relayers** to validate cross-chain transactions without manual intervention.
- **Integration with mainnet blockchains** such as Ethereum, Polygon, or Binance Smart Chain.
- **Support for additional asset types** beyond ERC20 tokens and NFTs.

## License
This project is licensed under the MIT License.

