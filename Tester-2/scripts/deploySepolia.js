require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
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

    // Distribute tokens unevenly to first 5 accounts
    console.log("\nDistributing wrapped tokens to accounts...");
    const distributions = [
        { account: deployer, amount: "500000" },  // 500,000 WNTK
        { account: acc1, amount: "300000" },      // 300,000 WNTK
        { account: acc2, amount: "150000" },      // 150,000 WNTK
        { account: acc3, amount: "35000" },       // 35,000 WNTK
        { account: acc4, amount: "15000" }        // 15,000 WNTK
    ];

    for (const dist of distributions) {
        const mintAmount = ethers.parseEther(dist.amount);
        const mintTx = await bridge.mintWrappedToken(dist.account.address, mintAmount);
        await mintTx.wait();
        console.log(`✅ Minted ${dist.amount} WNTK to account: ${dist.account.address}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});