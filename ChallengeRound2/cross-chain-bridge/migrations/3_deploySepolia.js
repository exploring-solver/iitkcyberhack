const WrappedToken = artifacts.require("WrappedToken");
const BridgeSepolia = artifacts.require("BridgeSepolia");

module.exports = async function (deployer, network, accounts) {
    if (network !== "localSepolia") return;

    console.log(`Deploying contracts on ${network}...`);

    await deployer.deploy(WrappedToken, "Wrapped Native Token", "WNTK", accounts[0]);
    const wrappedToken = await WrappedToken.deployed();
    console.log(`Wrapped Token deployed at: ${wrappedToken.address}`);

    await deployer.deploy(BridgeSepolia, wrappedToken.address, accounts[0]);
    const bridge = await BridgeSepolia.deployed();
    console.log(`Bridge deployed at: ${bridge.address}`);

    await wrappedToken.transferOwnership(bridge.address);
    console.log("Bridge set as token owner on LocalSepolia.");
};
