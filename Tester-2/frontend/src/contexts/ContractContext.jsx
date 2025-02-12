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
        nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    },
    sepolia: {
        token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        bridge: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        nft: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    }
};