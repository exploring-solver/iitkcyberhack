const { ethers } = require("hardhat");

module.exports = {
  networks: {
    localAmoy: {
      host: "127.0.0.1",
      port: 8545,  // Make sure Hardhat runs this on a separate port
      network_id: "*",
    },
    localSepolia: {
      host: "127.0.0.1",
      port: 8546,  // Make sure Hardhat runs this on a different port
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.20", // Use the same version as Hardhat
    },
  },
};
