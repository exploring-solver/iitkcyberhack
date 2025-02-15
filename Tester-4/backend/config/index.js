const path = require('path');
const AmoyBridgeABI = require('../artifacts/BridgeAmoy.sol/BridgeAmoy.json').abi;
const SepoliaBridgeABI = require('../artifacts/BridgeSepolia.sol/BridgeSepolia.json').abi;
require('dotenv').config()
const isValidPrivateKey = (key) => {
    try {
        if (!key) return false;
        const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
        return /^[0-9a-fA-F]{64}$/.test(cleanKey);
    } catch (error) {
        return false;
    }
};

const formatPrivateKey = (key) => {
    if (!key) return null;
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    return `0x${cleanKey}`;
};
const PRIVATE_KEYS = {
    amoy: process.env.RELAYER_PRIVATE_KEY,
    sepolia: process.env.RELAYER_PRIVATE_KEY
};

// Validate private keys before using them
Object.keys(PRIVATE_KEYS).forEach(network => {
    const key = PRIVATE_KEYS[network];
    if (key && !isValidPrivateKey(key)) {
        console.error(`Invalid private key format for ${network} network`);
        process.exit(1);
    }
    PRIVATE_KEYS[network] = formatPrivateKey(key || 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
});
const NETWORKS = {
    amoy: {
        chainId: '80002', // 31337 in hex for local hardhat network
        name: 'Amoy Network',
        rpcUrl: process.env.AMOY_RPC_URL || 'http://localhost:8545',
    },
    sepolia: {
        chainId: '11155111', // 31338 in hex
        name: 'Sepolia Network',
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'http://localhost:8546',
    }
};

const CONTRACT_ADDRESSES = {
    amoy: {
        token: '0x243CD2e2f06Bd3412b92e6FD3fc36633A42d4ccb',
        bridge: '0xebdf37A1EC829a41fBcFC8FbB4A44e243A8D9311',
        nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    },
    sepolia: {
        token: '0x2d53530b2FB7e5Ac919f4559066769ee4287f26b',
        bridge: '0x10dBb88A1F4d51FF054045e4326Ce8e903885b97',
        nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    }
};

const config = {
    amoy: {
        rpcUrl: process.env.AMOY_RPC_URL || 'http://localhost:8545',
        ...NETWORKS.amoy,
        bridgeAddress: CONTRACT_ADDRESSES.amoy.bridge,
        tokenAddress: CONTRACT_ADDRESSES.amoy.token,
        nftAddress: CONTRACT_ADDRESSES.amoy.nft,
        nftBridgeAddress: CONTRACT_ADDRESSES.amoy.nftBridge,
        bridgeABI: AmoyBridgeABI,
        relayerAccount: process.env.RELAYER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: PRIVATE_KEYS.amoy || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'http://localhost:8546',
        ...NETWORKS.sepolia,
        bridgeAddress: CONTRACT_ADDRESSES.sepolia.bridge,
        tokenAddress: CONTRACT_ADDRESSES.sepolia.token,
        nftAddress: CONTRACT_ADDRESSES.sepolia.nft,
        nftBridgeAddress: CONTRACT_ADDRESSES.sepolia.nftBridge,
        bridgeABI: SepoliaBridgeABI,
        relayerAccount: process.env.RELAYER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: PRIVATE_KEYS.sepolia || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    storage: {
        dataDir: path.join(__dirname, '..', 'data'),
        type: 'file'
    }
};

console.log('Loaded configuration:', {
    networks: NETWORKS,
    contracts: CONTRACT_ADDRESSES,
    storage: config.storage
});

module.exports = {
    config,
    NETWORKS,
    CONTRACT_ADDRESSES
}; 