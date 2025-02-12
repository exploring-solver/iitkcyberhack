require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    networks: {
        hardhat: {
            chainId: 31338,
            mining: {
                auto: true,
                interval: 0
            }
        }
    },
    solidity: "0.8.20",
};