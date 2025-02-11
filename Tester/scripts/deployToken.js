const hre = require("hardhat");

async function main() {
  const TestTokens = await hre.ethers.getContractFactory("TestTokens");
  const testTokens = await TestTokens.deploy();
  await testTokens.waitForDeployment();
  
  console.log("TestTokens deployed to:", await testTokens.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
