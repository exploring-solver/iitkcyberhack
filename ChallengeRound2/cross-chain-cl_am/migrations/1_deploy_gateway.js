// migrations/1_deploy_gateways.js
const ChainAGateway = artifacts.require("ChainAGateway");
const ChainBGateway = artifacts.require("ChainBGateway");
const WrappedERC20 = artifacts.require("WrappedERC20");
const WrappedERC721 = artifacts.require("WrappedERC721");

module.exports = async function(deployer, network, accounts) {
  const admin = accounts[0];
  
  // Deploy Chain A Gateway
  await deployer.deploy(ChainAGateway, { from: admin });
  const chainAGateway = await ChainAGateway.deployed();
  
  // Deploy Chain B Gateway
  await deployer.deploy(ChainBGateway, { from: admin });
  const chainBGateway = await ChainBGateway.deployed();
  
  // Deploy sample wrapped tokens (you'll need to deploy more for each original token)
  const originalToken = "0x..."; // Replace with original token address
  const originalChain = chainAGateway.address; // Using Chain A Gateway address as chain identifier
  
  await deployer.deploy(
    WrappedERC20,
    "Wrapped Token",
    "WTKN",
    originalToken,
    originalChain,
    { from: admin }
  );
  const wrappedERC20 = await WrappedERC20.deployed();
  
  await deployer.deploy(
    WrappedERC721,
    "Wrapped NFT",
    "WNFT",
    originalToken,
    originalChain,
    { from: admin }
  );
  const wrappedERC721 = await WrappedERC721.deployed();
  
  // Set up permissions
  const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");
  const BURNER_ROLE = web3.utils.soliditySha3("BURNER_ROLE");
  const RELAYER_ROLE = web3.utils.soliditySha3("RELAYER_ROLE");
  
  await wrappedERC20.grantRole(MINTER_ROLE, chainBGateway.address);
  await wrappedERC20.grantRole(BURNER_ROLE, chainBGateway.address);
  await wrappedERC721.grantRole(MINTER_ROLE, chainBGateway.address);
  await wrappedERC721.grantRole(BURNER_ROLE, chainBGateway.address);
  
  // Grant relayer role to admin (for testing)
  await chainAGateway.grantRole(RELAYER_ROLE, admin);
  await chainBGateway.grantRole(RELAYER_ROLE, admin);
  
  console.log("Deployment Summary:");
  console.log("===================");
  console.log(`Chain A Gateway: ${chainAGateway.address}`);
  console.log(`Chain B Gateway: ${chainBGateway.address}`);
  console.log(`Wrapped ERC20: ${wrappedERC20.address}`);
  console.log(`Wrapped ERC721: ${wrappedERC721.address}`);
};