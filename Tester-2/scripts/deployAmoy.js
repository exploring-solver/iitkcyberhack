require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy Native Token
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Native Token", "NTK", 1000000, deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("BridgeAmoy");
    const bridge = await Bridge.deploy(tokenAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as token owner
    await token.transferOwnership(bridgeAddress);
    console.log("Bridge set as token owner on LocalAmoy.");

    // Distribute tokens unevenly to first 5 accounts
    console.log("\nDistributing native tokens to accounts...");
    const distributions = [
        { account: deployer, amount: "400000" },  // 400,000 NTK
        { account: acc1, amount: "350000" },      // 350,000 NTK
        { account: acc2, amount: "175000" },      // 175,000 NTK
        { account: acc3, amount: "50000" },       // 50,000 NTK
        { account: acc4, amount: "25000" }        // 25,000 NTK
    ];

    for (const dist of distributions) {
        const transferAmount = ethers.parseEther(dist.amount);
        const tx = await token.transfer(dist.account.address, transferAmount);
        await tx.wait();
        console.log(`✅ Transferred ${dist.amount} NTK to account: ${dist.account.address}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});