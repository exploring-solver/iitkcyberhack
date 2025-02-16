require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    networks: {
        localAmoy: {
            url: "http://127.0.0.1:8545",
            chainId: 31337, // This matches 0x7A69 in the Web3Context
        },
        localSepolia: {
            url: "http://127.0.0.1:8546",
            chainId: 31338, // This matches 0x7A6A in the Web3Context
        },
        // hardhat: {
        //   chainId: 1337
        // },
    },
    solidity: "0.8.20",
};

// For prod:
// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//     networks: {
//         amoy: {
//             url: process.env.AMOY_RPC_URL || "",
//             accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//             chainId: 80002  // Amoy testnet chain ID
//         },
//         sepolia: {
//             url: process.env.SEPOLIA_RPC_URL || "",
//             accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
//             chainId: 11155111
//         }
//     },
//     etherscan: {
//         apiKey: process.env.ETHERSCAN_API_KEY
//     },
//     solidity: "0.8.20",
// };