const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy Token on Amoy
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("Native Token", "NTV", ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());

  // Deploy Wrapped Token on Sepolia
  const WrappedToken = await ethers.getContractFactory("WrappedToken");
  const wrappedToken = await WrappedToken.deploy(
    "Wrapped Token",
    "WNTV",
    await token.getAddress(),
    1 // originalChainId
  );
  await wrappedToken.waitForDeployment();
  console.log("WrappedToken deployed to:", await wrappedToken.getAddress());

  // Deploy Bridges
  const BridgeAmoy = await ethers.getContractFactory("BridgeAmoy");
  const bridgeAmoy = await BridgeAmoy.deploy(await token.getAddress());
  await bridgeAmoy.waitForDeployment();
  console.log("BridgeAmoy deployed to:", await bridgeAmoy.getAddress());

  const BridgeSepolia = await ethers.getContractFactory("BridgeSepolia");
  const bridgeSepolia = await BridgeSepolia.deploy(await wrappedToken.getAddress());
  await bridgeSepolia.waitForDeployment();
  console.log("BridgeSepolia deployed to:", await bridgeSepolia.getAddress());

  // Setup roles
  const relayerRole = await bridgeAmoy.RELAYER_ROLE();
  await bridgeAmoy.grantRole(relayerRole, process.env.RELAYER_ADDRESS);
  await bridgeSepolia.grantRole(relayerRole, process.env.RELAYER_ADDRESS);

  console.log("Roles granted to relayer:", process.env.RELAYER_ADDRESS);

  // Link bridges
  await bridgeAmoy.setRemoteBridge(await bridgeSepolia.getAddress());
  await bridgeSepolia.setRemoteBridge(await bridgeAmoy.getAddress());
  console.log("Bridges linked");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });