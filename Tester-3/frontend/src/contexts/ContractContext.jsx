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