const hre = require("hardhat");

async function main() {
  // Get test accounts
  const [deployer, ...accounts] = await hre.ethers.getSigners();
  const testAccounts = accounts.slice(0, 5); // Get top 5 accounts after deployer

  console.log("Deploying TestNFTs with account:", deployer.address);

  const TestNFTs = await hre.ethers.getContractFactory("TestNFTs");
  const testNFTs = await TestNFTs.deploy();
  await testNFTs.waitForDeployment();
  
  const nftAddress = await testNFTs.getAddress();
  console.log("TestNFTs deployed to:", nftAddress);

  // Mint and distribute NFTs to test accounts
  console.log("\nMinting and distributing NFTs...");
  
  for (let i = 0; i < testAccounts.length; i++) {
    const account = testAccounts[i];
    
    // Mint 2 NFTs for each account with different IPFS URIs
    for (let j = 0; j < 2; j++) {
      const tokenId = (i * 2) + j + 4; // Start from 4 since 3 are minted in constructor
      const uri = `ipfs://QmTest/${tokenId}`;
      
      await testNFTs.safeMint(account.address, uri);
      console.log(`Minted NFT #${tokenId} with URI ${uri} for account:`, account.address);
    }
  }

  console.log("\nNFT Distribution complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
