require("dotenv").config();
const { ethers } = require("hardhat");
async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on LocalAmoy with account: ${deployer.address}`);
    // Deploy Native Token - remove deployer.address from parameters
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
        "Native Token",  // name
        "NTK",          // symbol
        1000000         // initialSupply
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);
    // Deploy Bridge - remove deployer.address from parameters
    const Bridge = await ethers.getContractFactory("BridgeAmoy");
    const bridge = await Bridge.deploy(tokenAddress); // only needs token address
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);
    // Remove transferOwnership since it's not in the contract
    // Instead, grant MINTER_ROLE to the bridge
    await token.grantRole(await token.MINTER_ROLE(), bridgeAddress);
    console.log("Bridge granted MINTER_ROLE on LocalAmoy.");
    // Distribute tokens unevenly to first 5 accounts
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
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});