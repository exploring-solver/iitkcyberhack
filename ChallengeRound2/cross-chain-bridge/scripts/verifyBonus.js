const hre = require("hardhat");
const fs = require('fs');
async function verify() {
    const deploymentPath = `deployments/${hre.network.name}.json`;
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
    // Verify MerkleVerifier
    await hre.run("verify:verify", {
      address: deployment.merkleVerifier,
      constructorArguments: [ethers.encodeBytes32String("initial")],
    });
  
    // Verify DecentralizedRelayer
    await hre.run("verify:verify", {
      address: deployment.decentralizedRelayer,
      constructorArguments: [],
    });
  
    // Verify BridgeStorage
    await hre.run("verify:verify", {
      address: deployment.bridgeStorage,
      constructorArguments: [],
    });
  }
  
  verify().catch((error) => {
    console.error(error);
    process.exit(1);
  });