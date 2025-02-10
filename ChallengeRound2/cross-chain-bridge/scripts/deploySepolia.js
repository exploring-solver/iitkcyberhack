require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts on LocalSepolia with account: ${deployer.address}`);

    // Deploy Wrapped Token on LocalSepolia
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy("Wrapped Native Token", "WNTK", deployer.address);
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();
    console.log(`Wrapped Token deployed at: ${wrappedTokenAddress}`);

    // Deploy Bridge on LocalSepolia
    const Bridge = await ethers.getContractFactory("BridgeSepolia");
    const bridge = await Bridge.deploy(wrappedTokenAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as token owner
    await wrappedToken.transferOwnership(bridgeAddress);
    console.log("Bridge set as token owner on LocalSepolia.");

    // // ✅ Mint tokens via the Bridge contract
    // console.log("\nBridge is minting tokens to deployer...");
    // const mintAmount = ethers.parseEther("1000000"); // 1,000,000 WNTK
    // const mintTx = await bridge.mintWrappedToken(deployer.address, mintAmount);
    // await mintTx.wait();
    // console.log(`✅ Bridge minted ${ethers.formatEther(mintAmount)} WNTK to deployer: ${deployer.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});