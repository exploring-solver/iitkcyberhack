require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on LocalSepolia with account: ${deployer.address}`);

    // Constants for wrapped token
    const ORIGINAL_TOKEN_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" // Add your token address from Amoy
    const ORIGINAL_CHAIN_ID = 31337; // Add your Amoy chain ID

    // Deploy Wrapped Token on LocalSepolia
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(
        "Wrapped Native Token",    // name
        "WNTK",                   // symbol
        ORIGINAL_TOKEN_ADDRESS,   // _originalToken
        ORIGINAL_CHAIN_ID        // _originalChainId
    );
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();
    console.log(`Wrapped Token deployed at: ${wrappedTokenAddress}`);

    // Deploy Bridge on LocalSepolia
    const Bridge = await ethers.getContractFactory("BridgeSepolia");
    const bridge = await Bridge.deploy(wrappedTokenAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Grant roles to bridge
    await wrappedToken.grantRole(await wrappedToken.MINTER_ROLE(), bridgeAddress);
    await wrappedToken.grantRole(await wrappedToken.BURNER_ROLE(), bridgeAddress);
    console.log("Bridge granted MINTER_ROLE and BURNER_ROLE on LocalSepolia.");

    // Note: Remove token distribution as wrapped tokens should only be minted
    // through the bridge when tokens are locked on the other chain
    console.log("Setup completed successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});