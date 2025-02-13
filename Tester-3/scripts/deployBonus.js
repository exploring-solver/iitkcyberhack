const hre = require("hardhat");
const fs = require('fs');
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MerkleVerifier
  const initialRoot = ethers.utils.formatBytes32String("initial");
  const MerkleVerifier = await ethers.getContractFactory("MerkleVerifier");
  const merkleVerifier = await MerkleVerifier.deploy(initialRoot);
  await merkleVerifier.waitForDeployment();
  console.log("MerkleVerifier deployed to:", merkleVerifier.address);

  // Deploy DecentralizedRelayer
  const DecentralizedRelayer = await ethers.getContractFactory("DecentralizedRelayer");
  const decentralizedRelayer = await DecentralizedRelayer.deploy();
  await decentralizedRelayer.waitForDeployment();
  console.log("DecentralizedRelayer deployed to:", decentralizedRelayer.address);

  // Deploy BridgeStorage
  const BridgeStorage = await ethers.getContractFactory("BridgeStorage");
  const bridgeStorage = await BridgeStorage.deploy();
  await bridgeStorage.waitForDeployment();
  console.log("BridgeStorage deployed to:", bridgeStorage.address);

  // Save deployment addresses
  const deploymentData = {
    merkleVerifier: merkleVerifier.address,
    decentralizedRelayer: decentralizedRelayer.address,
    bridgeStorage: bridgeStorage.address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentData, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});