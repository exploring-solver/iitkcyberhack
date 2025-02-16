// deployAmoy.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { deployRelayerManager } = require("./deployRelayerManager");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on Amoy with account: ${deployer.address}`);

    // First deploy RelayerManager
    const { relayerManagerAddress } = await deployRelayerManager();

    // Deploy Native Token
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Native Token", "NTK", 1000000, deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Deploy Bridge V2
    const BridgeV2 = await ethers.getContractFactory("BridgeAmoyV2");
    const bridgeV2 = await BridgeV2.deploy(
        tokenAddress,
        relayerManagerAddress,
        deployer.address
    );
    await bridgeV2.waitForDeployment();
    const bridgeV2Address = await bridgeV2.getAddress();
    console.log(`BridgeV2 deployed at: ${bridgeV2Address}`);

    // Set bridge as token owner
    await token.transferOwnership(bridgeV2Address);
    console.log("BridgeV2 set as token owner on Amoy.");

    // Distribute tokens
    console.log("\nDistributing native tokens to accounts...");
    const distributions = [
        { account: deployer, amount: "400000" },
        { account: acc1, amount: "350000" },
        { account: acc2, amount: "175000" },
        { account: acc3, amount: "50000" },
        { account: acc4, amount: "25000" }
    ];

    for (const dist of distributions) {
        const transferAmount = ethers.parseEther(dist.amount);
        const tx = await token.transfer(dist.account.address, transferAmount);
        await tx.wait();
        console.log(`✅ Transferred ${dist.amount} NTK to account: ${dist.account.address}`);
    }

    // Save deployment addresses to a file
    const fs = require('fs');
    const deploymentInfo = {
        network: 'amoy',
        token: tokenAddress,
        bridge: bridgeV2Address,
        relayerManager: relayerManagerAddress
    };

    fs.writeFileSync(
        'deployment-amoy.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}


main().catch((error) => {
    console.error(error);
    process.exit(1);
});