require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const { MNEMONIC, INFURA_API_KEY } = process.env;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },
    rinkeby: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`),
      network_id: 4,
      gas: 4500000,
      gasPrice: 10000000000
    },
    goerli: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://goerli.infura.io/v3/${INFURA_API_KEY}`),
      network_id: 5,
      gas: 4500000,
      gasPrice: 10000000000
    },
    sepolia: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://sepolia.infura.io/v3/${INFURA_API_KEY}`),
      network_id: 11155111, // Sepolia's network id
      gas: 4500000,        // Gas limit
      gasPrice: null, // You can leave gasPrice as null for EIP-1559 transactions
      maxFeePerGas: 20000000000, // 20 Gwei (set higher than the current base fee)
      maxPriorityFeePerGas: 2000000000, // 2 Gwei (tip for the miner)
      networkCheckTimeout: 2000000 // Increase the timeout to a higher value (1,000,000 ms)
    }    
  },

  mocha: {
    timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.21", // Specify the exact version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  db: {
    enabled: false
  }
};
