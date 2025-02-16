// scripts/setupBothNetworks.js
require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const hre = require("hardhat");
require("hardhat-switch-network");
require("hardhat-change-network");

async function setupAmoy(addresses) {
    console.log("\n--- Setting up Amoy Network ---");
    await hre.switchNetwork("localAmoy");
    
    const amoyBridge = await ethers.getContractAt("BridgeAmoy", addresses.amoy.bridge);
    const amoyRelayer = await ethers.getContractAt("DecentralizedRelayer", addresses.amoy.relayer);

    // Set remote bridge
    try {
        console.log("Setting Amoy bridge remote to:", addresses.sepolia.bridge);
        const tx = await amoyBridge.setRemoteBridge(addresses.sepolia.bridge);
        await tx.wait();
        console.log("✅ Amoy bridge remote set successfully");
    } catch (error) {
        console.error("Failed to set Amoy bridge remote:", error.message);
    }

    // Grant relayer role to bridge if needed
    try {
        const hasRole = await amoyRelayer.hasRole(
            await amoyRelayer.RELAYER_ROLE(),
            addresses.amoy.bridge
        );
        if (!hasRole) {
            await amoyRelayer.grantRole(await amoyRelayer.RELAYER_ROLE(), addresses.amoy.bridge);
            console.log("✅ Granted relayer role to bridge");
        } else {
            console.log("✅ Bridge already has relayer role");
        }
    } catch (error) {
        console.error("Failed to grant relayer role:", error.message);
    }
}

async function setupSepolia(addresses) {
    console.log("\n--- Setting up Sepolia Network ---");
    
    await hre.changeNetwork("localSepolia");
    
    const sepoliaBridge = await ethers.getContractAt("BridgeSepolia", addresses.sepolia.bridge);
    const sepoliaRelayer = await ethers.getContractAt("DecentralizedRelayer", addresses.sepolia.relayer);

    // Set remote bridge
    try {
        console.log("Setting Sepolia bridge remote to:", addresses.amoy.bridge);
        const tx = await sepoliaBridge.setRemoteBridge(addresses.amoy.bridge);
        await tx.wait();
        console.log("✅ Sepolia bridge remote set successfully");
    } catch (error) {
        console.error("Failed to set Sepolia bridge remote:", error.message);
    }

    // Grant relayer role to bridge if needed
    try {
        const hasRole = await sepoliaRelayer.hasRole(
            await sepoliaRelayer.RELAYER_ROLE(),
            addresses.sepolia.bridge
        );
        if (!hasRole) {
            await sepoliaRelayer.grantRole(await sepoliaRelayer.RELAYER_ROLE(), addresses.sepolia.bridge);
            console.log("✅ Granted relayer role to bridge");
        } else {
            console.log("✅ Bridge already has relayer role");
        }
    } catch (error) {
        console.error("Failed to grant relayer role:", error.message);
    }
}

async function main() {
    console.log("Starting cross-chain setup...");

    // Load deployment addresses
    const addressesPath = path.join(__dirname, '../deployedAddresses/addresses.json');
    if (!fs.existsSync(addressesPath)) {
        throw new Error("Deployment addresses not found!");
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log("Loaded addresses:", addresses);

    // Setup each network
    await setupAmoy(addresses);
    await setupSepolia(addresses);

    console.log("\nSetup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });