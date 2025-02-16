// deploySepoliaNFT.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { deployRelayerManager } = require("./deployRelayerManager");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on Sepolia with account: ${deployer.address}`);

    // First deploy RelayerManager if not already deployed
    const { relayerManagerAddress } = await deployRelayerManager();

    // Deploy Wrapped NFT
    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNFT = await WrappedNFT.deploy(
        "Wrapped Native NFT",
        "WNNFT",
        deployer.address
    );
    await wrappedNFT.waitForDeployment();
    const wrappedNFTAddress = await wrappedNFT.getAddress();
    console.log(`Wrapped NFT deployed at: ${wrappedNFTAddress}`);

    // Deploy Bridge V2
    const BridgeV2 = await ethers.getContractFactory("BridgeSepoliaNFTV2");
    const bridgeV2 = await BridgeV2.deploy(
        wrappedNFTAddress,
        relayerManagerAddress,
        deployer.address
    );
    await bridgeV2.waitForDeployment();
    const bridgeV2Address = await bridgeV2.getAddress();
    console.log(`NFT BridgeV2 deployed at: ${bridgeV2Address}`);

    // Set bridge as NFT owner
    await wrappedNFT.transferOwnership(bridgeV2Address);
    console.log("BridgeV2 set as NFT owner on Sepolia.");

    // Note: We don't pre-mint any wrapped NFTs as they will be minted
    // when NFTs are bridged from Amoy

    // Save deployment addresses to a file
    const fs = require('fs');
    const deploymentInfo = {
        network: 'sepolia',
        wrappedNFT: wrappedNFTAddress,
        bridge: bridgeV2Address,
        relayerManager: relayerManagerAddress
    };

    fs.writeFileSync(
        'deployment-sepolia-nft.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});