const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross Chain Bridge", function () {
  let nativeToken;
  let wrappedToken;
  let bridgeAmoy;
  let bridgeSepolia;
  let owner;
  let addr1;
  let addr2;
  const initialSupply = 1000000; // 1 million tokens
  const transferAmount = ethers.parseEther("10");

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    console.log("Testing with account:", owner.address);
  });

  beforeEach(async function () {
    // Deploy Native Token on Amoy
    const Token = await ethers.getContractFactory("Token");
    nativeToken = await Token.deploy(
      "Native Token",
      "NTK",
      initialSupply,
      owner.address
    );
    await nativeToken.waitForDeployment();
    console.log("Native Token deployed to:", await nativeToken.getAddress());

    // Deploy Wrapped Token on Sepolia
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    wrappedToken = await WrappedToken.deploy(
      "Wrapped Native Token",
      "WNTK",
      owner.address
    );
    await wrappedToken.waitForDeployment();
    console.log("Wrapped Token deployed to:", await wrappedToken.getAddress());

    // Deploy Amoy Bridge
    const BridgeAmoy = await ethers.getContractFactory("BridgeAmoy");
    bridgeAmoy = await BridgeAmoy.deploy(
      await nativeToken.getAddress(),
      owner.address
    );
    await bridgeAmoy.waitForDeployment();
    console.log("Amoy Bridge deployed to:", await bridgeAmoy.getAddress());

    // Deploy Sepolia Bridge
    const BridgeSepolia = await ethers.getContractFactory("BridgeSepolia");
    bridgeSepolia = await BridgeSepolia.deploy(
      await wrappedToken.getAddress(),
      owner.address
    );
    await bridgeSepolia.waitForDeployment();
    console.log("Sepolia Bridge deployed to:", await bridgeSepolia.getAddress());

    // Set up bridge ownership and permissions
    await nativeToken.transferOwnership(await bridgeAmoy.getAddress());
    await wrappedToken.transferOwnership(await bridgeSepolia.getAddress());
    console.log("Ownership transferred to bridges");

    // Set remote bridges
    await bridgeAmoy.setRemoteBridge(await bridgeSepolia.getAddress());
    await bridgeSepolia.setRemoteBridge(await bridgeAmoy.getAddress());
    console.log("Remote bridges set up");
  });

  describe("Initial Setup", function () {
    it("Should deploy tokens with correct initial supply", async function () {
      const nativeTokenBalance = await nativeToken.balanceOf(owner.address);
      expect(nativeTokenBalance).to.equal(
        ethers.parseEther(initialSupply.toString())
      );
      console.log("Native token initial balance:", ethers.formatEther(nativeTokenBalance));
    });

    it("Should set correct ownership", async function () {
      expect(await nativeToken.owner()).to.equal(await bridgeAmoy.getAddress());
      expect(await wrappedToken.owner()).to.equal(await bridgeSepolia.getAddress());
      console.log("Token ownership verified");
    });
  });

  describe("Bridge Operations", function () {
    it("Should complete full bridge cycle: Amoy -> Sepolia -> Amoy", async function () {
      // Initial balance check
      const initialBalance = await nativeToken.balanceOf(owner.address);
      console.log("Initial native token balance:", ethers.formatEther(initialBalance));

      // Step 1: Lock tokens on Amoy
      console.log("\nStep 1: Locking tokens on Amoy");
      await nativeToken.approve(await bridgeAmoy.getAddress(), transferAmount);
      await bridgeAmoy.lock(transferAmount);
      
      const postLockBalance = await nativeToken.balanceOf(owner.address);
      console.log("Balance after lock:", ethers.formatEther(postLockBalance));
      expect(postLockBalance).to.equal(initialBalance - transferAmount);

      // Step 2: Release wrapped tokens on Sepolia
      console.log("\nStep 2: Releasing wrapped tokens on Sepolia");
      await bridgeSepolia.release(owner.address, transferAmount);
      
      const wrappedBalance = await wrappedToken.balanceOf(owner.address);
      console.log("Wrapped token balance:", ethers.formatEther(wrappedBalance));
      expect(wrappedBalance).to.equal(transferAmount);

      // Step 3: Burn wrapped tokens on Sepolia
      console.log("\nStep 3: Burning wrapped tokens on Sepolia");
      await wrappedToken.approve(await bridgeSepolia.getAddress(), transferAmount);
      await bridgeSepolia.burn(transferAmount);
      
      const postBurnBalance = await wrappedToken.balanceOf(owner.address);
      console.log("Balance after burn:", ethers.formatEther(postBurnBalance));
      expect(postBurnBalance).to.equal(0);

      // Step 4: Unlock tokens on Amoy
      console.log("\nStep 4: Unlocking tokens on Amoy");
      await bridgeAmoy.unlock(owner.address, transferAmount);
      
      const finalBalance = await nativeToken.balanceOf(owner.address);
      console.log("Final native token balance:", ethers.formatEther(finalBalance));
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should fail to lock more tokens than available", async function () {
      const excessAmount = ethers.parseEther((initialSupply + 1).toString());
      await expect(
        bridgeAmoy.lock(excessAmount)
      ).to.be.reverted;
      console.log("Successfully prevented excess token lock");
    });

    it("Should fail to release tokens from unauthorized address", async function () {
      const unauthorizedBridge = bridgeSepolia.connect(addr1);
      await expect(
        unauthorizedBridge.release(owner.address, transferAmount)
      ).to.be.reverted;
      console.log("Successfully prevented unauthorized release");
    });
  });

  describe("Events", function () {
    it("Should emit correct events during bridge operations", async function () {
      // Test Lock event
      await nativeToken.approve(await bridgeAmoy.getAddress(), transferAmount);
      await expect(bridgeAmoy.lock(transferAmount))
        .to.emit(bridgeAmoy, "Locked")
        .withArgs(owner.address, transferAmount);
      console.log("Lock event emitted correctly");

      // Test Release event
      await expect(bridgeSepolia.release(owner.address, transferAmount))
        .to.emit(bridgeSepolia, "Released")
        .withArgs(owner.address, transferAmount);
      console.log("Release event emitted correctly");
    });
  });
});