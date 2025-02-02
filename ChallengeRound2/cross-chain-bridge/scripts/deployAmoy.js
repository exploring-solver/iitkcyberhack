require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy Native Token on LocalAmoy
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Native Token", "NTK", 1000000, deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Deploy Bridge on LocalAmoy
    const Bridge = await ethers.getContractFactory("BridgeAmoy");
    const bridge = await Bridge.deploy(tokenAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as token owner
    await token.transferOwnership(bridgeAddress);
    console.log("Bridge set as token owner on LocalAmoy.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});