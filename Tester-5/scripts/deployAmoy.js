// scripts/deployAmoy.js
require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3] = signers;
    console.log(`Deploying contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy RelayerFactory
    console.log("Deploying RelayerFactory...");
    const RelayerFactory = await ethers.getContractFactory("RelayerFactory");
    const factory = await RelayerFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(`RelayerFactory deployed at: ${factoryAddress}`);

    // Deploy Relayer through factory with deterministic address
    const salt = ethers.id("CROSS_CHAIN_RELAYER_V1");
    const expectedAddress = await factory.computeAddress(salt);
    console.log("Expected relayer address:", expectedAddress);

    const deployTx = await factory.deploy(salt);
    const receipt = await deployTx.wait();
    const deployEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'RelayerDeployed'
    );
    const relayerAddress = deployEvent.args.relayerAddress;
    console.log("Actual relayer address:", relayerAddress);

    // Deploy Native Token
    console.log("Deploying Native Token...");
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
        "Native Token",
        "NTK",
        ethers.parseEther("1000000")
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Deploy Bridge
    console.log("Deploying Bridge...");
    const Bridge = await ethers.getContractFactory("BridgeAmoy");
    const bridge = await Bridge.deploy(tokenAddress, relayerAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Setup roles
    console.log("Setting up roles...");
    await token.grantRole(await token.MINTER_ROLE(), bridgeAddress);
    await token.grantRole(await token.BURNER_ROLE(), bridgeAddress);
    console.log("Bridge granted MINTER_ROLE and BURNER_ROLE on Token");

    // Deploy a new DecentralizedRelayer contract (not through factory) to set up roles
    console.log("Deploying control relayer...");
    const DecentralizedRelayer = await ethers.getContractFactory("DecentralizedRelayer");
    const controlRelayer = await DecentralizedRelayer.deploy();
    await controlRelayer.waitForDeployment();

    // Add relayers
    console.log("Adding initial relayers...");
    const relayerAddresses = [acc1.address, acc2.address, acc3.address];
    
    for (const addr of relayerAddresses) {
        await controlRelayer.addRelayer(addr);
        await bridge.addRelayer(addr);
        console.log(`Added relayer: ${addr}`);
    }

    // After deploying contracts
    console.log("Setting up roles...");

    // Grant roles to bridge
    const RELAYER_ROLE = await controlRelayer.RELAYER_ROLE();
    await controlRelayer.grantRole(RELAYER_ROLE, bridgeAddress);

    // Grant roles to relayer addresses
    for (const relayerAddress of relayerAddresses) {
        await controlRelayer.grantRole(RELAYER_ROLE, relayerAddress);
    }

    // Verify roles
    const bridgeHasRole = await controlRelayer.hasRole(RELAYER_ROLE, bridgeAddress);
    console.log('Bridge has relayer role:', bridgeHasRole);

    // Save deployed addresses
    const deployedAddresses = {
        chain: "amoy",
        relayerAddresses,
        contracts: {
            token: tokenAddress,
            bridge: bridgeAddress,
            relayer: relayerAddress
        }
    };

    // Ensure the deployedAddresses directory exists
    const deployDir = path.join(__dirname, '../deployedAddresses');
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir);
    }

    // Write addresses to file
    fs.writeFileSync(
        path.join(deployDir, 'amoy.json'),
        JSON.stringify(deployedAddresses, null, 2)
    );

    console.log("\nDeployment complete! Addresses saved to deployedAddresses/amoy.json");
    console.log(deployedAddresses);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });