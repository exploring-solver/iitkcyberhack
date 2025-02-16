// Helper script to link bridges after deployment
async function main() {
    const amoyDeployment = require('./deployment-amoy.json');
    const sepoliaDeployment = require('./deployment-sepolia.json');

    const [deployer] = await ethers.getSigners();

    // Link Amoy bridge to Sepolia bridge
    const amoyBridge = await ethers.getContractAt(
        "BridgeAmoyV2",
        amoyDeployment.bridge,
        deployer
    );
    await amoyBridge.setRemoteBridge(sepoliaDeployment.bridge);
    console.log("Amoy bridge linked to Sepolia bridge");

    // Link Sepolia bridge to Amoy bridge
    const sepoliaBridge = await ethers.getContractAt(
        "BridgeSepoliaV2",
        sepoliaDeployment.bridge,
        deployer
    );
    await sepoliaBridge.setRemoteBridge(amoyDeployment.bridge);
    console.log("Sepolia bridge linked to Amoy bridge");
}


main().catch((error) => {
    console.error(error);
    process.exit(1);
});