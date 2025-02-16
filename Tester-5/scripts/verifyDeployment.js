// scripts/verifyDeployment.js
require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Verifying deployment...");

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
    const amoyToken = await ethers.getContractAt("Token", addresses.amoy.token);
    const wrappedToken = await ethers.getContractAt("WrappedToken", addresses.sepolia.wrappedToken);

    console.log("\nVerifying bridge connections...");
    try {
        const amoyRemote = await amoyBridge.remoteBridge();
        console.log("Amoy bridge remote:", amoyRemote);
        if (amoyRemote.toLowerCase() === addresses.sepolia.bridge.toLowerCase()) {
            console.log("✅ Amoy bridge remote address correct");
        } else {
            console.log("❌ Amoy bridge remote address incorrect or not set");
        }
    } catch (error) {
        console.log("❌ Amoy bridge remote not set");
    }

    try {
        const sepoliaRemote = await sepoliaBridge.remoteBridge();
        console.log("Sepolia bridge remote:", sepoliaRemote);
        if (sepoliaRemote.toLowerCase() === addresses.amoy.bridge.toLowerCase()) {
            console.log("✅ Sepolia bridge remote address correct");
        } else {
            console.log("❌ Sepolia bridge remote address incorrect or not set");
        }
    } catch (error) {
        console.log("❌ Sepolia bridge remote not set");
    }

    console.log("\nVerifying token connections...");
    try {
        const originalToken = await wrappedToken.originalToken();
        console.log("Wrapped token original address:", originalToken);
        if (originalToken.toLowerCase() === addresses.amoy.token.toLowerCase()) {
            console.log("✅ Wrapped token original address correct");
        } else {
            console.log("❌ Wrapped token original address incorrect");
        }
    } catch (error) {
        console.log("❌ Failed to verify wrapped token connection");
    }

    console.log("\nVerifying relayer setup...");
    try {
        const amoyRelayer = await ethers.getContractAt("DecentralizedRelayer", addresses.amoy.relayer);
        const sepoliaRelayer = await ethers.getContractAt("DecentralizedRelayer", addresses.sepolia.relayer);

        // Check if addresses match
        if (addresses.amoy.relayer.toLowerCase() === addresses.sepolia.relayer.toLowerCase()) {
            console.log("✅ Relayer addresses match across chains");
        } else {
            console.log("❌ Relayer addresses don't match across chains");
        }
    } catch (error) {
        console.log("❌ Failed to verify relayer setup");
    }

    console.log("\nVerification complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });