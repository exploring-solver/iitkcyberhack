require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const MNEMONIC = process.env.MNEMONIC || "test test test test test test test test test test test junk";

// Task to start local networks
task("start-local", "Starts multiple local networks")
  .setAction(async () => {
    // Start Chain A
    await hre.run("node", {
      port: 8545,
      hostname: "127.0.0.1"
    });

    // Start Chain B
    await hre.run("node", {
      port: 8546,
      hostname: "127.0.0.1"
    });
  });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    chainA: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },
    chainB: {
      url: "http://127.0.0.1:8546",
      chainId: 31338, // Different chainId for Chain B
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};