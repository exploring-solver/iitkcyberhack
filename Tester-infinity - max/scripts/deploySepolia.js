// deploySepolia.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { deployRelayerManager } = require("./deployRelayerManager");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on Sepolia with account: ${deployer.address}`);

    // First deploy RelayerManager if not already deployed
    const { relayerManagerAddress } = await deployRelayerManager();

    // Deploy Wrapped Token
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(
        "Wrapped Native Token",
        "WNTK",
        deployer.address
    );
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();
    console.log(`Wrapped Token deployed at: ${wrappedTokenAddress}`);

    // Deploy Bridge V2
    const BridgeV2 = await ethers.getContractFactory("BridgeSepoliaV2");
    const bridgeV2 = await BridgeV2.deploy(
        wrappedTokenAddress,
        relayerManagerAddress,
        deployer.address
    );
    await bridgeV2.waitForDeployment();
    const bridgeV2Address = await bridgeV2.getAddress();
    console.log(`BridgeV2 deployed at: ${bridgeV2Address}`);

    // Set bridge as token owner
    await wrappedToken.transferOwnership(bridgeV2Address);
    console.log("BridgeV2 set as token owner on Sepolia.");

    // Distribute tokens
    console.log("\nDistributing wrapped tokens to accounts...");
    const distributions = [
        { account: deployer, amount: "500000" },
        { account: acc1, amount: "300000" },
        { account: acc2, amount: "150000" },
        { account: acc3, amount: "35000" },
        { account: acc4, amount: "15000" }
    ];

    // for (const dist of distributions) {
    //     const mintAmount = ethers.parseEther(dist.amount);
    //     const mintTx = await bridgeV2.mintWrappedToken(dist.account.address, mintAmount);
    //     await mintTx.wait();
    //     console.log(`✅ Minted ${dist.amount} WNTK to account: ${dist.account.address}`);
    // }

    // Save deployment addresses to a file
    const fs = require('fs');
    const deploymentInfo = {
        network: 'sepolia',
        wrappedToken: wrappedTokenAddress,
        bridge: bridgeV2Address,
        relayerManager: relayerManagerAddress
    };

    fs.writeFileSync(
        'deployment-sepolia.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}


main().catch((error) => {
    console.error(error);
    process.exit(1);
});