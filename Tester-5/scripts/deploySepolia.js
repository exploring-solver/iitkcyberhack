// scripts/deploySepolia.js
require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3] = signers;
    console.log(`Deploying contracts on LocalSepolia with account: ${deployer.address}`);

    // Load Amoy deployment addresses
    const amoyAddressesPath = path.join(__dirname, '../deployedAddresses/amoy.json');
    if (!fs.existsSync(amoyAddressesPath)) {
        throw new Error("Please deploy Amoy contracts first and ensure amoy.json exists");
    }

    const amoyAddresses = JSON.parse(fs.readFileSync(amoyAddressesPath, 'utf8'));
    const originalTokenAddress = amoyAddresses.contracts.token;
    const amoyRelayerAddress = amoyAddresses.contracts.relayer;
    const relayerAddresses = amoyAddresses.relayerAddresses;

    console.log("Amoy relayer address:", amoyRelayerAddress);

    // Deploy RelayerFactory
    console.log("Deploying RelayerFactory...");
    const RelayerFactory = await ethers.getContractFactory("RelayerFactory");
    const factory = await RelayerFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(`RelayerFactory deployed at: ${factoryAddress}`);

    // Deploy Relayer using same initialization parameters
    const salt = ethers.id("CROSS_CHAIN_RELAYER_V1");
    const expectedAddress = await factory.computeAddress(salt);
    console.log("Expected relayer address:", expectedAddress);

    // Deploy the relayer
    const deployTx = await factory.deploy(salt);
    const receipt = await deployTx.wait();
    const deployEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'RelayerDeployed'
    );
    const relayerAddress = deployEvent.args.relayerAddress;
    console.log("Actual relayer address:", relayerAddress);

    // Get Relayer contract instance
    const DecentralizedRelayer = await ethers.getContractFactory("DecentralizedRelayer");
    const relayer = await DecentralizedRelayer.attach(relayerAddress);

    // Deploy Wrapped Token
    console.log("Deploying Wrapped Token...");
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(
        "Wrapped Native Token",
        "WNTK",
        originalTokenAddress,
        31337  // Amoy chain ID
    );
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();
    console.log(`Wrapped Token deployed at: ${wrappedTokenAddress}`);

    // Deploy Bridge
    console.log("Deploying Bridge...");
    const Bridge = await ethers.getContractFactory("BridgeSepolia");
    const bridge = await Bridge.deploy(wrappedTokenAddress, relayerAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Setup roles for bridge and relayer
    console.log("Setting up roles...");
    
    // First, grant DEFAULT_ADMIN_ROLE to deployer in the relayer contract
    const DEFAULT_ADMIN_ROLE = await relayer.DEFAULT_ADMIN_ROLE();
    const RELAYER_ROLE = await relayer.RELAYER_ROLE();

    console.log("Setting up admin role...");
    
    // Check if deployer already has admin role
    const hasAdminRole = await relayer.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    if (!hasAdminRole) {
        // Initialize roles - this should be called right after deployment
        await relayer.initialize(deployer.address);
        console.log("Initialized relayer with deployer as admin");
    }

    // Now grant roles
    console.log("Granting roles...");
    
    // Grant relayer role to bridge
    await relayer.grantRole(RELAYER_ROLE, bridgeAddress);
    console.log("Granted RELAYER_ROLE to bridge");

    // Grant token roles to bridge
    await wrappedToken.grantRole(await wrappedToken.MINTER_ROLE(), bridgeAddress);
    await wrappedToken.grantRole(await wrappedToken.BURNER_ROLE(), bridgeAddress);
    console.log("Bridge granted MINTER_ROLE and BURNER_ROLE on Wrapped Token");

    // Add initial relayers
    console.log("Adding initial relayers...");
    for (const addr of relayerAddresses) {
        await relayer.grantRole(RELAYER_ROLE, addr);
        await bridge.grantRole(RELAYER_ROLE, addr);
        console.log(`Added relayer: ${addr}`);
    }

    // Verify roles
    const bridgeHasRole = await relayer.hasRole(RELAYER_ROLE, bridgeAddress);
    console.log('Bridge has relayer role:', bridgeHasRole);

    // Verify each relayer
    for (const addr of relayerAddresses) {
        const hasRole = await relayer.hasRole(RELAYER_ROLE, addr);
        console.log(`Relayer ${addr} has role:`, hasRole);
    }

    // Save deployed addresses
    const deployedAddresses = {
        chain: "sepolia",
        relayerAddresses,
        contracts: {
            wrappedToken: wrappedTokenAddress,
            bridge: bridgeAddress,
            relayer: relayerAddress
        }
    };

    // Write addresses to file
    fs.writeFileSync(
        path.join(__dirname, '../deployedAddresses/sepolia.json'),
        JSON.stringify(deployedAddresses, null, 2)
    );

    console.log("\nDeployment complete! Addresses saved to deployedAddresses/sepolia.json");
    console.log(deployedAddresses);

    // Generate final addresses file with both deployments
    const finalAddresses = {
        amoy: amoyAddresses.contracts,
        sepolia: deployedAddresses.contracts,
        relayerAddresses
    };

    fs.writeFileSync(
        path.join(__dirname, '../deployedAddresses/addresses.json'),
        JSON.stringify(finalAddresses, null, 2)
    );
    console.log("\nFinal addresses saved to deployedAddresses/addresses.json");

    // Now let's link the bridges
    console.log("\nSetting up bridge remote addresses...");
    
    const amoyBridge = await ethers.getContractAt("BridgeAmoy", amoyAddresses.contracts.bridge);
    const sepoliaBridge = await ethers.getContractAt("BridgeSepolia", bridgeAddress);

    // Set remote bridge addresses
    await amoyBridge.setRemoteBridge(bridgeAddress);
    await sepoliaBridge.setRemoteBridge(amoyAddresses.contracts.bridge);
    
    console.log("Bridge remote addresses set up successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });