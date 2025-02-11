require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    console.log(`Deploying NFT contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy Native NFT
    const NativeNFT = await ethers.getContractFactory("NativeNFT");
    const nativeNFT = await NativeNFT.deploy("Native NFT", "NNFT", deployer.address);
    await nativeNFT.waitForDeployment();
    const nativeNFTAddress = await nativeNFT.getAddress();
    console.log(`Native NFT deployed at: ${nativeNFTAddress}`);

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("BridgeAmoyNFT");
    const bridge = await Bridge.deploy(nativeNFTAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as NFT owner
    await nativeNFT.transferOwnership(bridgeAddress);
    console.log("Bridge set as NFT owner on LocalAmoy");

    // Mint NFTs to test accounts on local network
    const network = await ethers.provider.getNetwork();
    // Mint 5 NFT to the deployer
    for (let i = 1; i <= 5; i++) {
        const tx = await bridge.mint(deployer.address);
        await tx.wait();
        console.log(`✅ Minted NFT to deployer: ${deployer.address}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});