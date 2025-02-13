const { ethers } = require("hardhat");
const { expect } = require("chai");

async function deployTokenContracts(deployer) {
    // Deploy Token on Amoy
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
        "Native Token",
        "NTK",
        ethers.parseEther("1000000")
    );
    await token.waitForDeployment();

    // Deploy Wrapped Token on Sepolia
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(
        "Wrapped Token",
        "WNTK",
        await token.getAddress(),
        31337 // Amoy chainId
    );
    await wrappedToken.waitForDeployment();

    return { token, wrappedToken };
}

async function deployNFTContracts(deployer) {
    // Deploy Native NFT on Amoy
    const NativeNFT = await ethers.getContractFactory("NativeNFT");
    const nativeNFT = await NativeNFT.deploy(
        "Native NFT",
        "NNFT"
    );
    await nativeNFT.waitForDeployment();

    // Deploy Wrapped NFT on Sepolia
    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNFT = await WrappedNFT.deploy(
        "Wrapped NFT",
        "WNFT",
        await nativeNFT.getAddress(),
        31337 // Amoy chainId
    );
    await wrappedNFT.waitForDeployment();

    return { nativeNFT, wrappedNFT };
}

async function deployBridgeContracts(token, wrappedToken, nativeNFT, wrappedNFT) {
    // Deploy Amoy Bridge
    const BridgeAmoy = await ethers.getContractFactory("BridgeAmoy");
    const bridgeAmoy = await BridgeAmoy.deploy(await token.getAddress());
    await bridgeAmoy.waitForDeployment();

    // Deploy Sepolia Bridge
    const BridgeSepolia = await ethers.getContractFactory("BridgeSepolia");
    const bridgeSepolia = await BridgeSepolia.deploy(await wrappedToken.getAddress());
    await bridgeSepolia.waitForDeployment();

    // Deploy NFT Bridges
    const BridgeAmoyNFT = await ethers.getContractFactory("BridgeAmoyNFT");
    const bridgeAmoyNFT = await BridgeAmoyNFT.deploy(await nativeNFT.getAddress());
    await bridgeAmoyNFT.waitForDeployment();

    const BridgeSepoliaNFT = await ethers.getContractFactory("BridgeSepoliaNFT");
    const bridgeSepoliaNFT = await BridgeSepoliaNFT.deploy(await wrappedNFT.getAddress());
    await bridgeSepoliaNFT.waitForDeployment();

    return { bridgeAmoy, bridgeSepolia, bridgeAmoyNFT, bridgeSepoliaNFT };
}

async function setupRoles(contracts, relayer) {
    const {
        token,
        wrappedToken,
        nativeNFT,
        wrappedNFT,
        bridgeAmoy,
        bridgeSepolia,
        bridgeAmoyNFT,
        bridgeSepoliaNFT
    } = contracts;

    // Grant roles for tokens
    await token.grantRole(await token.MINTER_ROLE(), await bridgeAmoy.getAddress());
    await token.grantRole(await token.BURNER_ROLE(), await bridgeAmoy.getAddress());
    await wrappedToken.grantRole(await wrappedToken.MINTER_ROLE(), await bridgeSepolia.getAddress());
    await wrappedToken.grantRole(await wrappedToken.BURNER_ROLE(), await bridgeSepolia.getAddress());

    // Grant roles for NFTs
    await nativeNFT.grantRole(await nativeNFT.MINTER_ROLE(), await bridgeAmoyNFT.getAddress());
    await nativeNFT.grantRole(await nativeNFT.BURNER_ROLE(), await bridgeAmoyNFT.getAddress());
    await wrappedNFT.grantRole(await wrappedNFT.MINTER_ROLE(), await bridgeSepoliaNFT.getAddress());
    await wrappedNFT.grantRole(await wrappedNFT.BURNER_ROLE(), await bridgeSepoliaNFT.getAddress());

    // Grant relayer roles
    await bridgeAmoy.grantRole(await bridgeAmoy.RELAYER_ROLE(), relayer.address);
    await bridgeSepolia.grantRole(await bridgeSepolia.RELAYER_ROLE(), relayer.address);
    await bridgeAmoyNFT.grantRole(await bridgeAmoyNFT.RELAYER_ROLE(), relayer.address);
    await bridgeSepoliaNFT.grantRole(await bridgeSepoliaNFT.RELAYER_ROLE(), relayer.address);
}

async function setupBridgeConnections(contracts) {
    const { bridgeAmoy, bridgeSepolia, bridgeAmoyNFT, bridgeSepoliaNFT } = contracts;

    // Set remote bridges
    await bridgeAmoy.setRemoteBridge(await bridgeSepolia.getAddress());
    await bridgeSepolia.setRemoteBridge(await bridgeAmoy.getAddress());
    await bridgeAmoyNFT.setRemoteBridge(await bridgeSepoliaNFT.getAddress());
    await bridgeSepoliaNFT.setRemoteBridge(await bridgeAmoyNFT.getAddress());
}

module.exports = {
    deployTokenContracts,
    deployNFTContracts,
    deployBridgeContracts,
    setupRoles,
    setupBridgeConnections
}; 