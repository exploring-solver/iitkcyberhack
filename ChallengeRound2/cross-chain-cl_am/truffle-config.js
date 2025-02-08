

// truffle-config.js
module.exports = {
  networks: {
    chainA: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
    },
    chainB: {
      host: "127.0.0.1",
      port: 8546,
      network_id: "*",
      gas: 6721975,
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};