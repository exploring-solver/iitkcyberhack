const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const network = hre.network.name;
  console.log(`\nDeploying contracts on ${network}...`);

  if (network === "chainA") {
    // Deploy Chain A Gateway
    const ChainAGateway = await hre.ethers.getContractFactory("ChainAGateway");
    const chainAGateway = await ChainAGateway.deploy();
    console.log(`Chain A Gateway deployed to: ${chainAGateway.address}`);

    // Save address to file
    const deploymentInfo = { chainA: { gateway: chainAGateway.address } };
    fs.writeFileSync("deployment-chainA.json", JSON.stringify(deploymentInfo, null, 2));

  } else if (network === "chainB") {
    // Load Chain A Gateway Address
    const chainAInfo = JSON.parse(fs.readFileSync("deployment-chainA.json"));
    const chainAGatewayAddress = chainAInfo.chainA.gateway;

    // Deploy Chain B Gateway
    const ChainBGateway = await hre.ethers.getContractFactory("ChainBGateway");
    const chainBGateway = await ChainBGateway.deploy();
    console.log(`Chain B Gateway deployed to: ${chainBGateway.address}`);

    // Deploy Wrapped ERC20
    const WrappedERC20 = await hre.ethers.getContractFactory("WrappedERC20");
    const wrappedERC20 = await WrappedERC20.deploy("Wrapped Test Token", "WTEST", "0x0000000000000000000000000000000000000000", chainAGatewayAddress);
    console.log(`Wrapped ERC20 deployed to: ${wrappedERC20.address}`);

    // Deploy Wrapped ERC721
    const WrappedERC721 = await hre.ethers.getContractFactory("WrappedERC721");
    const wrappedERC721 = await WrappedERC721.deploy("Wrapped Test NFT", "WNFT", "0x0000000000000000000000000000000000000000", chainAGatewayAddress);
    console.log(`Wrapped ERC721 deployed to: ${wrappedERC721.address}`);

    // Save address to file
    const deploymentInfo = {
      chainB: {
        gateway: chainBGateway.address,
        wrappedERC20: wrappedERC20.address,
        wrappedERC721: wrappedERC721.address,
      },
    };
    fs.writeFileSync("deployment-chainB.json", JSON.stringify(deploymentInfo, null, 2));
  } else {
    console.error("Unsupported network. Use chainA or chainB.");
    process.exit(1);
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
