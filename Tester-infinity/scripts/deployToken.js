const hre = require("hardhat");
const { parseEther } = hre.ethers;

async function main() {
  // Get test accounts
  const [deployer, ...accounts] = await hre.ethers.getSigners();
  const testAccounts = accounts.slice(0, 5); // Get top 5 accounts after deployer

  console.log("Deploying TestTokens with account:", deployer.address);

  const TestTokens = await hre.ethers.getContractFactory("TestTokens");
  const testTokens = await TestTokens.deploy();
  await testTokens.waitForDeployment();
  
  const tokenAddress = await testTokens.getAddress();
  console.log("TestTokens deployed to:", tokenAddress);

  // Distribute tokens to test accounts
  console.log("\nDistributing tokens to test accounts...");
  
  for (const account of testAccounts) {
    // Mint 10,000 tokens for each test account
    const amount = parseEther("10000");
    await testTokens.mint(account.address, amount);
    console.log(`Minted 10,000 tokens for account:`, account.address);
  }

  // Distribute some test ETH to accounts if needed
  console.log("\nDistributing test ETH...");
  
  for (const account of testAccounts) {
    // Send 1 ETH to each test account
    const tx = await deployer.sendTransaction({
      to: account.address,
      value: parseEther("1")
    });
    await tx.wait();
    console.log(`Sent 1 ETH to account:`, account.address);
  }

  console.log("\nToken Distribution complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});