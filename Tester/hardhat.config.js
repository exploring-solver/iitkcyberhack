require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    },
    amoy: {
      url: `https://rpc.amoy.technology`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};