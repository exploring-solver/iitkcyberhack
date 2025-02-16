// scripts/verifyBothNetworks.js
require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function verifyAmoy(addresses) {
    console.log("\n--- Verifying Amoy Network ---");
    
    await hre.changeNetwork("localAmoy");
    
    const amoyBridge = await ethers.getContractAt("BridgeAmoy", addresses.amoy.bridge);
    const amoyToken = await ethers.getContractAt("Token", addresses.amoy.token);
    const amoyRelayer = await ethers.getContractAt("DecentralizedRelayer", addresses.amoy.relayer);

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

    // Verify relayer role for bridge
    try {
        const hasRole = await amoyRelayer.hasRole(
            await amoyRelayer.RELAYER_ROLE(),
            addresses.amoy.bridge
        );
        console.log(hasRole ? "✅ Bridge has relayer role" : "❌ Bridge missing relayer role");
    } catch (error) {
        console.log("❌ Failed to verify bridge relayer role");
    }
}

async function verifySepolia(addresses) {
    console.log("\n--- Verifying Sepolia Network ---");
    
    await hre.changeNetwork("localSepolia");
    
    const sepoliaBridge = await ethers.getContractAt("BridgeSepolia", addresses.sepolia.bridge);
    const wrappedToken = await ethers.getContractAt("WrappedToken", addresses.sepolia.wrappedToken);
    const sepoliaRelayer = await ethers.getContractAt("DecentralizedRelayer", addresses.sepolia.relayer);

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

    // Verify relayer role for bridge
    try {
        const hasRole = await sepoliaRelayer.hasRole(
            await sepoliaRelayer.RELAYER_ROLE(),
            addresses.sepolia.bridge
        );
        console.log(hasRole ? "✅ Bridge has relayer role" : "❌ Bridge missing relayer role");
    } catch (error) {
        console.log("❌ Failed to verify bridge relayer role");
    }
}

async function main() {
    console.log("Starting cross-chain verification...");

    // Load deployment addresses
    const addressesPath = path.join(__dirname, '../deployedAddresses/addresses.json');
    if (!fs.existsSync(addressesPath)) {
        throw new Error("Deployment addresses not found!");
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log("Loaded addresses:", addresses);

    // Verify each network
    await verifyAmoy(addresses);
    await verifySepolia(addresses);

    console.log("\nVerification complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });