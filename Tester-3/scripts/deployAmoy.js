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
    // Distribution to public accounts
    const publicAccounts = [
        "0xD57e0418F112bf27912174Db6E53354a1661946A", // Chanmeet 1
        "0xec1FF0DD6C735F756c9360dd7F345210373E1A94", // Chanmeet 2
        "0xB5F23C0Ef0d707B45a8C0f40fF27f7D945EDDd03",  // Aman 1
        "0xf7586028E21F80EbE4aE81df2Cd9f01f155Ee4c4", // Aman 2
        "0xB7Cf4907313428413A0f17A3e6eA1644E0472d68"  //Ansh
    ];

    const distributions = publicAccounts.map((address, index) => ({
        address,
        amount: ["400000", "350000", "250000"][index] || "100000" // Default 100,000 if index > 2
    }));

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