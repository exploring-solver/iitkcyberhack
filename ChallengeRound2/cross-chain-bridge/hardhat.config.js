// require("@nomicfoundation/hardhat-toolbox");

// module.exports = {
//     networks: {
//         localAmoy: {
//             url: "http://127.0.0.1:8545",
//             accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"], // Pick from 'npx hardhat node' accounts
//         },
//         localSepolia: {
//             url: "http://127.0.0.1:8546",
//             accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
//         },
//     },
//     solidity: "0.8.20",
// };

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    networks: {
        localAmoy: {
            url: "http://127.0.0.1:8545",
            chainId: 31337, // This matches 0x7A69 in the Web3Context
            accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
        },
        localSepolia: {
            url: "http://127.0.0.1:8546",
            chainId: 31338, // This matches 0x7A6A in the Web3Context
            accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
        },
    },
    solidity: "0.8.20",
};
