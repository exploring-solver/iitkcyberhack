// deploySepoliaNFT.js
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying NFT contracts on LocalSepolia with account: ${deployer.address}`);

    // Deploy Wrapped NFT on LocalSepolia
    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNFT = await WrappedNFT.deploy("Wrapped Native NFT", "WNNFT", deployer.address);
    await wrappedNFT.waitForDeployment();
    const wrappedNFTAddress = await wrappedNFT.getAddress();
    console.log(`Wrapped NFT deployed at: ${wrappedNFTAddress}`);

    // Deploy Bridge on LocalSepolia
    const Bridge = await ethers.getContractFactory("BridgeSepoliaNFT");
    const bridge = await Bridge.deploy(wrappedNFTAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as NFT owner
    await wrappedNFT.transferOwnership(bridgeAddress);
    console.log("Bridge set as NFT owner on LocalSepolia");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});