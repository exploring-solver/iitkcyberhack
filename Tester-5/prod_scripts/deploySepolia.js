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
    if (network.config.chainId !== 11155111) {
        throw new Error("This script is intended to be run on Sepolia network only");
    }

    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts on Sepolia with account: ${deployer.address}`);

    // Constants for wrapped token
    // Make sure to update these values after Amoy deployment
    const ORIGINAL_TOKEN_ADDRESS = process.env.AMOY_TOKEN_ADDRESS;
    if (!ORIGINAL_TOKEN_ADDRESS) {
        throw new Error("Please set AMOY_TOKEN_ADDRESS in your .env file");
    }
    const ORIGINAL_CHAIN_ID = 80002; // Amoy testnet chain ID

    // Deploy Wrapped Token
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(
        "Wrapped Native Token",
        "WNTK",
        ORIGINAL_TOKEN_ADDRESS,
        ORIGINAL_CHAIN_ID
    );
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();
    console.log(`Wrapped Token deployed at: ${wrappedTokenAddress}`);

    // Verify Wrapped Token contract
    // if (process.env.ETHERSCAN_API_KEY) {
    //     await verify(wrappedTokenAddress, [
    //         "Wrapped Native Token",
    //         "WNTK",
    //         ORIGINAL_TOKEN_ADDRESS,
    //         ORIGINAL_CHAIN_ID
    //     ]);
    // }

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("BridgeSepolia");
    const bridge = await Bridge.deploy(wrappedTokenAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Verify Bridge contract
    // if (process.env.ETHERSCAN_API_KEY) {
    //     await verify(bridgeAddress, [wrappedTokenAddress]);
    // }

    // Grant roles to bridge
    const MINTER_ROLE = await wrappedToken.MINTER_ROLE();
    const BURNER_ROLE = await wrappedToken.BURNER_ROLE();

    await wrappedToken.grantRole(MINTER_ROLE, bridgeAddress);
    console.log("Bridge granted MINTER_ROLE");

    await wrappedToken.grantRole(BURNER_ROLE, bridgeAddress);
    console.log("Bridge granted BURNER_ROLE");

    // Log deployment summary
    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log(`Network: Sepolia (${network.config.chainId})`);
    console.log(`Wrapped Token Address: ${wrappedTokenAddress}`);
    console.log(`Bridge Address: ${bridgeAddress}`);
    console.log(`Original Token Address (on Amoy): ${ORIGINAL_TOKEN_ADDRESS}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });