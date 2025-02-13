require("dotenv").config();
const { ethers, network, run } = require("hardhat");

async function verify(contractAddress, args) {
    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.error(e);
        }
    }
}

async function main() {
    // Check if we're on the right network
    if (network.config.chainId !== 80002) {
        throw new Error("This script is intended to be run on Amoy network only");
    }

    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts on Amoy with account: ${deployer.address}`);

    // Deploy Native Token
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
        "Native Token",  // name
        "NTK",          // symbol
        1000000         // initialSupply
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Verify Token contract
    // if (process.env.ETHERSCAN_API_KEY) {
    //     await verify(tokenAddress, ["Native Token", "NTK", 1000000]);
    // }

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("BridgeAmoy");
    const bridge = await Bridge.deploy(tokenAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Verify Bridge contract
    // if (process.env.ETHERSCAN_API_KEY) {
    //     await verify(bridgeAddress, [tokenAddress]);
    // }

    // Grant MINTER_ROLE to bridge
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, bridgeAddress);
    console.log("Bridge granted MINTER_ROLE on Amoy");

    // Distribution to specified accounts
    const distributions = [
        { address: "0xD57e0418F112bf27912174Db6E53354a1661946A", amount: "400000" },
        { address: "0xec1FF0DD6C735F756c9360dd7F345210373E1A94", amount: "350000" },
        { address: "0xB5F23C0Ef0d707B45a8C0f40fF27f7D945EDDd03", amount: "250000" },
        { address: "0xf7586028E21F80EbE4aE81df2Cd9f01f155Ee4c4", amount: "100000" },
        { address: "0xB7Cf4907313428413A0f17A3e6eA1644E0472d68", amount: "100000" }
    ];

    console.log("\nDistributing native tokens to accounts...");
    for (const dist of distributions) {
        try {
            const transferAmount = ethers.parseEther(dist.amount);
            const tx = await token.transfer(dist.address, transferAmount);
            await tx.wait();
            console.log(`✅ Transferred ${dist.amount} NTK to: ${dist.address}`);
        } catch (error) {
            console.error(`❌ Failed to transfer to ${dist.address}:`, error.message);
        }
    }

    // Log deployment summary
    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log(`Network: Amoy (${network.config.chainId})`);
    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Bridge Address: ${bridgeAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });