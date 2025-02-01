require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // Deploy ERC-20 Token
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Bridge Token", "BGT", 1000000, deployer.address);
    // await token.deployed();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Token deployed at: ${tokenAddress}`);

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("Bridge");
    const bridge = await Bridge.deploy(tokenAddress, deployer.address);
    // await bridge.deployed();
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as token owner
    await token.transferOwnership(bridgeAddress);
    console.log("Bridge set as token owner.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
