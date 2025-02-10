const WrappedNFT = artifacts.require("WrappedNFT");
const BridgeSepoliaNFT = artifacts.require("BridgeSepoliaNFT");

module.exports = async function (deployer, network, accounts) {
    if (network !== "localSepolia") return; // Ensure it only runs for LocalSepolia

    console.log(`Deploying NFT contracts on LocalSepolia with account: ${accounts[0]}`);

    // Deploy Wrapped NFT
    await deployer.deploy(WrappedNFT, "Wrapped Native NFT", "WNNFT", accounts[0]);
    const wrappedNFT = await WrappedNFT.deployed();
    console.log(`Wrapped NFT deployed at: ${wrappedNFT.address}`);

    // Deploy Bridge
    await deployer.deploy(BridgeSepoliaNFT, wrappedNFT.address, accounts[0]);
    const bridge = await BridgeSepoliaNFT.deployed();
    console.log(`Bridge deployed at: ${bridge.address}`);

    // Set bridge as NFT owner
    await wrappedNFT.transferOwnership(bridge.address);
    console.log("Bridge set as NFT owner on LocalSepolia.");
};
