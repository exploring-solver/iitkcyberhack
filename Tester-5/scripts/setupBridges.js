// scripts/setupBridges.js
require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Setting up bridge connections...");

    // Load deployment addresses
    const addressesPath = path.join(__dirname, '../deployedAddresses/addresses.json');
    if (!fs.existsSync(addressesPath)) {
        throw new Error("Deployment addresses not found!");
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log("Loaded addresses:", addresses);

    // Get contract instances
    const amoyBridge = await ethers.getContractAt("BridgeAmoy", addresses.amoy.bridge);
    const sepoliaBridge = await ethers.getContractAt("BridgeSepolia", addresses.sepolia.bridge);

    console.log("\nSetting remote bridge addresses...");
    
    // Set remote addresses
    try {
        console.log("Setting Amoy bridge remote to:", addresses.sepolia.bridge);
        const amoyTx = await amoyBridge.setRemoteBridge(addresses.sepolia.bridge);
        await amoyTx.wait();
        console.log("✅ Amoy bridge remote set successfully");
    } catch (error) {
        console.error("Failed to set Amoy bridge remote:", error.message);
    }

    try {
        console.log("Setting Sepolia bridge remote to:", addresses.amoy.bridge);
        const sepoliaTx = await sepoliaBridge.setRemoteBridge(addresses.amoy.bridge);
        await sepoliaTx.wait();
        console.log("✅ Sepolia bridge remote set successfully");
    } catch (error) {
        console.error("Failed to set Sepolia bridge remote:", error.message);
    }

    // Verify the settings
    try {
        const amoyRemote = await amoyBridge.remoteBridge();
        console.log("\nAmoy bridge remote address:", amoyRemote);
        if (amoyRemote.toLowerCase() === addresses.sepolia.bridge.toLowerCase()) {
            console.log("✅ Amoy bridge remote verified");
        } else {
            console.log("❌ Amoy bridge remote mismatch");
        }
    } catch (error) {
        console.error("Failed to verify Amoy bridge remote:", error.message);
    }

    try {
        const sepoliaRemote = await sepoliaBridge.remoteBridge();
        console.log("Sepolia bridge remote address:", sepoliaRemote);
        if (sepoliaRemote.toLowerCase() === addresses.amoy.bridge.toLowerCase()) {
            console.log("✅ Sepolia bridge remote verified");
        } else {
            console.log("❌ Sepolia bridge remote mismatch");
        }
    } catch (error) {
        console.error("Failed to verify Sepolia bridge remote:", error.message);
    }

    console.log("\nBridge setup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });