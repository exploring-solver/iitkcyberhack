// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
// };

// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
//   networks: {
//     mainnet: {
//       // url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
//       url : `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
//       accounts: [`0x${process.env.PRIVATE_KEY}`],
//     },
//   },
// };


require("@nomicfoundation/hardhat-toolbox");

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20", // For OpenZeppelin contracts
      },
      {
        version: "0.8.28", // For your `Forwarder.sol`
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};


