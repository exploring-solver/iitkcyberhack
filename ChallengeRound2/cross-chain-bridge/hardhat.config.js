// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// module.exports = {
//     networks: {
//         amoy: {
//             url: process.env.AMOY_RPC,
//             accounts: [process.env.PRIVATE_KEY],
//         },
//         sepolia: {
//             url: process.env.SEPOLIA_RPC,
//             accounts: [process.env.PRIVATE_KEY],
//         },
//     },
//     solidity: "0.8.20",
// };

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    networks: {
        localAmoy: {
            url: "http://127.0.0.1:8545",
            accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"], // Pick from 'npx hardhat node' accounts
        },
        localSepolia: {
            url: "http://127.0.0.1:8546",
            accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
        },
    },
    solidity: "0.8.20",
};
