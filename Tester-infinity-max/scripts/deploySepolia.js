// deploySepolia.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { deployRelayerManager } = require("./deployRelayerManager");
const { deployNFTRelayerManager } = require("./deployNFTRelayerManager");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on Sepolia with account: ${deployer.address}`);

    // Deploy both relayer managers if not already deployed
    const { relayerManagerAddress } = await deployRelayerManager();
    const { nftRelayerManagerAddress } = await deployNFTRelayerManager();

    // Deploy Wrapped Token
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(
        "Wrapped Native Token",
        "WNTK",
        deployer.address // admin
    );
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();

    // Deploy Wrapped NFT
    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNFT = await WrappedNFT.deploy(
        "Wrapped Native NFT",
        "WNNFT",
        deployer.address // admin
    );
    await wrappedNFT.waitForDeployment();
    const wrappedNFTAddress = await wrappedNFT.getAddress();

    // Deploy Bridges
    const minTransfer = ethers.parseEther("0.01");
    const maxTransfer = ethers.parseEther("1000");

    const BridgeV2 = await ethers.getContractFactory("BridgeSepoliaV2");
    const bridgeV2 = await BridgeV2.deploy(
        wrappedTokenAddress,
        relayerManagerAddress,
        deployer.address, // admin
        minTransfer,
        maxTransfer
    );
    await bridgeV2.waitForDeployment();
    const bridgeV2Address = await bridgeV2.getAddress();

    const NFTBridgeV2 = await ethers.getContractFactory("BridgeSepoliaNFTV2");
    const nftBridgeV2 = await NFTBridgeV2.deploy(
        wrappedNFTAddress,
        nftRelayerManagerAddress,
        deployer.address // admin
    );
    await nftBridgeV2.waitForDeployment();
    const nftBridgeV2Address = await nftBridgeV2.getAddress();

    // Grant roles to bridges
    await wrappedToken.grantRole(await wrappedToken.MINTER_ROLE(), bridgeV2Address);
    await wrappedToken.grantRole(await wrappedToken.BURNER_ROLE(), bridgeV2Address);
    await wrappedNFT.grantRole(await wrappedNFT.MINTER_ROLE(), nftBridgeV2Address);
    await wrappedNFT.grantRole(await wrappedNFT.BURNER_ROLE(), nftBridgeV2Address);

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        network: 'sepolia',
        wrappedToken: wrappedTokenAddress,
        wrappedNFT: wrappedNFTAddress,
        bridge: bridgeV2Address,
        nftBridge: nftBridgeV2Address,
        relayerManager: relayerManagerAddress,
        nftRelayerManager: nftRelayerManagerAddress
    };

    fs.writeFileSync(
        './deployment-sepolia.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});