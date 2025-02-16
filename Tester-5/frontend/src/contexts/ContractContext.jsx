// network-config.js
export const NETWORKS = {
    amoy: {
        chainId: '0x' + Number(import.meta.env.VITE_AMOY_CHAIN_ID || '31337').toString(16),
        name: import.meta.env.VITE_AMOY_NETWORK_NAME || 'Amoy Network',
        rpcUrl: import.meta.env.VITE_AMOY_RPC_URL || 'http://localhost:8545',
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        }
    },
    sepolia: {
        chainId: '0x' + Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID || '11155111').toString(16),
        name: import.meta.env.VITE_SEPOLIA_NETWORK_NAME || 'Sepolia Network',
        rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'http://localhost:8546',
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        }
    }
};

export const CONTRACT_ADDRESSES = {
    amoy: {
        token: import.meta.env.VITE_AMOY_TOKEN_ADDRESS || '0x243CD2e2f06Bd3412b92e6FD3fc36633A42d4ccb',
        bridge: import.meta.env.VITE_AMOY_BRIDGE_ADDRESS || '0xebdf37A1EC829a41fBcFC8FbB4A44e243A8D9311',
        nft: import.meta.env.VITE_AMOY_NFT_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: import.meta.env.VITE_AMOY_NFT_BRIDGE_ADDRESS || '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
        relayer: import.meta.env.VITE_AMOY_RELAYER_ADDRESS || '0x3aAde2dCD2Df6a8cAc689EE797591b2913658659',
    },
    sepolia: {
        token: import.meta.env.VITE_SEPOLIA_TOKEN_ADDRESS || '0x2d53530b2FB7e5Ac919f4559066769ee4287f26b',
        bridge: import.meta.env.VITE_SEPOLIA_BRIDGE_ADDRESS || '0x10dBb88A1F4d51FF054045e4326Ce8e903885b97',
        nft: import.meta.env.VITE_SEPOLIA_NFT_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
        nftBridge: import.meta.env.VITE_SEPOLIA_NFT_BRIDGE_ADDRESS || '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
        relayer: import.meta.env.VITE_SEPOLIA_RELAYER_ADDRESS || '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
    }
};

// Optional: Add a utility function to check if we're using env vars or defaults
export const getConfigSource = (networkType, configType) => {
    const envVar = `${networkType.toUpperCase()}_${configType.toUpperCase()}`;
    return import.meta.env[envVar] ? 'environment' : 'default';
};

// Log configuration sources on initialization
console.log('Network Configuration Sources:');
['amoy', 'sepolia'].forEach(network => {
    console.log(`\n${network.toUpperCase()}:`);
    console.log(`Chain ID: ${getConfigSource(network, 'chain_id')}`);
    console.log(`RPC URL: ${getConfigSource(network, 'rpc_url')}`);
    console.log(`Token Address: ${getConfigSource(network, 'token_address')}`);
    console.log(`Bridge Address: ${getConfigSource(network, 'bridge_address')}`);
});