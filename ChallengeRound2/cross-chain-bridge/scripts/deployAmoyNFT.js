// deployAmoyNFT.js
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying NFT contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy Native NFT on LocalAmoy
    const NativeNFT = await ethers.getContractFactory("NativeNFT");
    const nativeNFT = await NativeNFT.deploy("Native NFT", "NNFT", deployer.address);
    await nativeNFT.waitForDeployment();
    const nativeNFTAddress = await nativeNFT.getAddress();
    console.log(`Native NFT deployed at: ${nativeNFTAddress}`);

    // Deploy Bridge on LocalAmoy
    const Bridge = await ethers.getContractFactory("BridgeAmoyNFT");
    const bridge = await Bridge.deploy(nativeNFTAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as NFT owner
    await nativeNFT.transferOwnership(bridgeAddress);
    console.log("Bridge set as NFT owner on LocalAmoy");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});