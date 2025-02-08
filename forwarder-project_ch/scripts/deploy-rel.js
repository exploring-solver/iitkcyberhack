// scripts/deploy-relayer.js
const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const Relayer = await hre.ethers.getContractFactory("Rel");

  // Deploy the contract
  const relayer = await Relayer.deploy();

//   await relayer.deployed();
  await relayer.waitForDeployment();

  // Retrieve and log the deployed contract's address
  const relayerAddress = await relayer.getAddress();
  console.log("Relayer deployed to:", relayerAddress);

  // console.log("Relayer deployed to:", relayer.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
