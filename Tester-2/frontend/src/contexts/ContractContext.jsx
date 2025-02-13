// Network configurations
export const NETWORKS = {
    amoy: {
        chainId: '0x13882', // 80002 in hex for amoy network
        chainName: 'Amoy',
        nativeCurrency: {
            name: 'POL',
            symbol: 'POL',
            decimals: 18
        },
        rpcUrls: ['https://rpc-amoy.polygon.technology/'],
        blockExplorerUrls: ['https://www.oklink.com/amoy'],
    },
    sepolia: {
        chainId: '0xAA36A7', // 11155111  in hex for sepolia
        chainName: 'Sepolia Network',
        nativeCurrency: {
            name: 'SepoliaETH',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://rpc.sepolia.org'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
    }
};

// Contract addresses - replace with your deployed addresses
export const CONTRACT_ADDRESSES = {
    amoy: {
        token: '0xa3873c01A31Da848B32cb0195c49075c45057f85',
        bridge: '0xd5e4E3aDA303A95EbfF9592E5e5678DfB8907624',
        nft: '0x861635ECCbb30a35FA86D2377d7D7DAbB567263e',
        nftBridge: '0xC16e3C5A44529A8F37CFa0162c6AAf6bB6798D03',
    },
    sepolia: {
        token: '0x1de8d602161b0960C50f35ad103EAB0DE569Af32',
        bridge: '0x6cC676A56713D7e0a0f4F7fb174fad78a346B363',
        nft: '0x9A1B14686A92af64a613E42EFfb7a9c1B77188B4',
        nftBridge: '0xC9D92e5017d4748feBD8e276725681c65a767451',
    }
};