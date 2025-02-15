const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const accounts = await hre.ethers.getSigners();
  const topAccounts = accounts.slice(0, 5);

  // Fund accounts with test ETH/MATIC
  for (const account of topAccounts) {
    // Send SepoliaETH
    if (hre.network.name === "sepolia") {
      await deployer.sendTransaction({
        to: account.address,
        value: hre.ethers.parseEther("100")
      });
    }
    // Send Amoy MATIC
    else if (hre.network.name === "amoy") {
      await deployer.sendTransaction({
        to: account.address,
        value: hre.ethers.parseEther("500")
      });
    }
  }

  console.log("Funded top 5 accounts on", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});