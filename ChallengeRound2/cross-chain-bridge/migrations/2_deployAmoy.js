const Token = artifacts.require("Token");
const BridgeAmoy = artifacts.require("BridgeAmoy");

module.exports = async function (deployer, network, accounts) {
    if (network !== "localAmoy") return;

    console.log(`Deploying contracts on ${network}...`);
    
    await deployer.deploy(Token, "Native Token", "NTK", 1000000, accounts[0]);
    const token = await Token.deployed();
    console.log(`Token deployed at: ${token.address}`);

    await deployer.deploy(BridgeAmoy, token.address, accounts[0]);
    const bridge = await BridgeAmoy.deployed();
    console.log(`Bridge deployed at: ${bridge.address}`);

    await token.transferOwnership(bridge.address);
    console.log("Bridge set as token owner on LocalAmoy.");
};
