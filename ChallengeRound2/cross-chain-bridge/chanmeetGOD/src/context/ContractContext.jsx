// Network configurations
export const NETWORKS = {
    amoy: {
        chainId: '0x7A69', // 31337 in hex for local hardhat network
        name: 'Amoy Network',
        rpcUrl: 'http://localhost:8545',
    },
    sepolia: {
        chainId: '0x7A6A', // Changed to 31338 in hex
        name: 'Sepolia Network',
        rpcUrl: 'http://localhost:8546', // Update this if using actual Sepolia testnet
    }
};

// Contract addresses - replace with your deployed addresses
export const CONTRACT_ADDRESSES = {
    amoy: {
        token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        bridge: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        nft: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        nftBridge: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    },
    sepolia: {
        token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        bridge: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        nft: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
        nftBridge: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    }
};