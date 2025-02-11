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