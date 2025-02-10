const NativeNFT = artifacts.require("NativeNFT");
const BridgeAmoyNFT = artifacts.require("BridgeAmoyNFT");

module.exports = async function (deployer, network, accounts) {
    if (network !== "localAmoy") return; // Ensure it only runs for LocalAmoy

    console.log(`Deploying NFT contracts on LocalAmoy with account: ${accounts[0]}`);

    // Deploy Native NFT
    await deployer.deploy(NativeNFT, "Native NFT", "NNFT", accounts[0]);
    const nativeNFT = await NativeNFT.deployed();
    console.log(`Native NFT deployed at: ${nativeNFT.address}`);

    // Deploy Bridge
    await deployer.deploy(BridgeAmoyNFT, nativeNFT.address, accounts[0]);
    const bridge = await BridgeAmoyNFT.deployed();
    console.log(`Bridge deployed at: ${bridge.address}`);

    // Set bridge as NFT owner
    await nativeNFT.transferOwnership(bridge.address);
    console.log("Bridge set as NFT owner on LocalAmoy.");

    // Mint NFTs to test accounts
    if (network === "localAmoy") {
        console.log("\nMinting test NFTs to accounts...");
        for (let i = 1; i <= 5; i++) {
            if (accounts[i]) {
                await bridge.mint(accounts[i]);
                console.log(`Minted NFT to ${accounts[i]}`);
            }
        }
    }
};
