const path = require('path');
const AmoyBridgeABI = require('../../artifacts/contracts/BridgeAmoy.sol/BridgeAmoy.json').abi;
const SepoliaBridgeABI = require('../../artifacts/contracts/BridgeSepolia.sol/BridgeSepolia.json').abi;

const NETWORKS = {
    amoy: {
        chainId: '0x7A69', // 31337 in hex for local hardhat network
        name: 'Amoy Network',
        rpcUrl: 'http://localhost:8545',
    },
    sepolia: {
        chainId: '0x7A6A', // 31338 in hex
        name: 'Sepolia Network',
        rpcUrl: 'http://localhost:8546',
    }
};

const CONTRACT_ADDRESSES = {
    amoy: {
        token: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
        bridge: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
        nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    },
    sepolia: {
        token: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
        bridge: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
        nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    }
};

const config = {
    amoy: {
        rpcUrl: 'http://localhost:8545',
        ...NETWORKS.amoy,
        bridgeAddress: CONTRACT_ADDRESSES.amoy.bridge,
        tokenAddress: CONTRACT_ADDRESSES.amoy.token,
        nftAddress: CONTRACT_ADDRESSES.amoy.nft,
        nftBridgeAddress: CONTRACT_ADDRESSES.amoy.nftBridge,
        bridgeABI: AmoyBridgeABI,
        relayerAccount: process.env.RELAYER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    sepolia: {
        rpcUrl: 'http://localhost:8546',
        ...NETWORKS.sepolia,
        bridgeAddress: CONTRACT_ADDRESSES.sepolia.bridge,
        tokenAddress: CONTRACT_ADDRESSES.sepolia.token,
        nftAddress: CONTRACT_ADDRESSES.sepolia.nft,
        nftBridgeAddress: CONTRACT_ADDRESSES.sepolia.nftBridge,
        bridgeABI: SepoliaBridgeABI,
        relayerAccount: process.env.RELAYER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
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