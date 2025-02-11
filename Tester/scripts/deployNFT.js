const hre = require("hardhat");

async function main() {
  const TestNFTs = await hre.ethers.getContractFactory("TestNFTs");
  const testNFTs = await TestNFTs.deploy();
  await testNFTs.waitForDeployment();
  
  console.log("TestNFTs deployed to:", await testNFTs.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});