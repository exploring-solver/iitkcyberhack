// test/security.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("Bridge Security Tests", function () {
    let Token, WrappedToken, BridgeAmoy, BridgeSepolia, RelayerManager;
    let token, wrappedToken, bridgeAmoy, bridgeSepolia, relayerManager;
    let owner, user1, user2, relayer, attacker;
    let merkleTree, relayerProof;
    const minTransfer = ethers.parseEther("0.01");
    const maxTransfer = ethers.parseEther("1000");

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2, relayer, attacker] = await ethers.getSigners();

        // Setup merkle tree for relayer
        const relayers = [relayer.address];
        const leaves = relayers.map(addr => keccak256(addr));
        merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = merkleTree.getRoot();
        relayerProof = merkleTree.getHexProof(keccak256(relayer.address));

        // Deploy contracts
        Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Native Token", "NTK", 1000000, owner.address);

        WrappedToken = await ethers.getContractFactory("WrappedToken");
        wrappedToken = await WrappedToken.deploy("Wrapped Token", "WNTK", owner.address);

        RelayerManager = await ethers.getContractFactory("RelayerManager");
        relayerManager = await RelayerManager.deploy(root, owner.address);

        BridgeAmoy = await ethers.getContractFactory("BridgeAmoyV2");
        bridgeAmoy = await BridgeAmoy.deploy(
            await token.getAddress(),
            await relayerManager.getAddress(),
            owner.address,
            minTransfer,
            maxTransfer
        );

        BridgeSepolia = await ethers.getContractFactory("BridgeSepoliaV2");
        bridgeSepolia = await BridgeSepolia.deploy(
            await wrappedToken.getAddress(),
            await relayerManager.getAddress(),
            owner.address,
            minTransfer,
            maxTransfer
        );

        // Setup roles
        await token.grantRole(await token.MINTER_ROLE(), bridgeAmoy.getAddress());
        await token.grantRole(await token.BURNER_ROLE(), bridgeAmoy.getAddress());
        await wrappedToken.grantRole(await wrappedToken.MINTER_ROLE(), bridgeSepolia.getAddress());
        await wrappedToken.grantRole(await wrappedToken.BURNER_ROLE(), bridgeSepolia.getAddress());

        // Fund user1 with tokens
        await token.transfer(user1.address, ethers.parseEther("100"));
    });

    describe("Access Control Tests", function () {
        it("Should prevent non-admin from granting roles", async function () {
            const minterRole = await token.MINTER_ROLE();
            // Use revertedWithCustomError instead of revertedWith
            await expect(
                token.connect(attacker).grantRole(minterRole, attacker.address)
            ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
        });

        it("Should prevent non-admin from updating transfer limits", async function () {
            await expect(
                bridgeAmoy.connect(attacker).updateTransferLimits(
                    ethers.parseEther("0.1"),
                    ethers.parseEther("10")
                )
            ).to.be.revertedWithCustomError(bridgeAmoy, "AccessControlUnauthorizedAccount");
        });

        it("Should prevent non-relayer from executing transfers", async function () {
            const amount = ethers.parseEther("1");
            await token.connect(user1).approve(bridgeAmoy.getAddress(), amount);
            
            const tx = await bridgeAmoy.connect(user1).lockWithRelay(
                amount,
                user2.address
            );
            const receipt = await tx.wait();
            const requestId = receipt.logs[1].args[0]; // Get requestId from event

            // Try to release with non-relayer
            await expect(
                bridgeSepolia.connect(attacker).release(
                    requestId,
                    user2.address,
                    amount,
                    relayerProof
                )
            ).to.be.revertedWith("Invalid relayer");
        });
    });

    describe("Emergency Pause Tests", function () {
        it("Should allow admin to pause and unpause the bridge", async function () {
            // Pause the bridge
            await bridgeAmoy.connect(owner).pause();
            expect(await bridgeAmoy.paused()).to.be.true;

            // Try to execute a transfer while paused
            const amount = ethers.parseEther("1");
            await token.connect(user1).approve(bridgeAmoy.getAddress(), amount);
            
            await expect(
                bridgeAmoy.connect(user1).lockWithRelay(amount, user2.address)
            ).to.be.revertedWithCustomError(bridgeAmoy, "EnforcedPause");

            // Unpause and verify transfer works
            await bridgeAmoy.connect(owner).unpause();
            expect(await bridgeAmoy.paused()).to.be.false;

            await expect(
                bridgeAmoy.connect(user1).lockWithRelay(amount, user2.address)
            ).to.not.be.reverted;
        });

        it("Should prevent non-admin from pausing", async function () {
            await expect(
                bridgeAmoy.connect(attacker).pause()
            ).to.be.revertedWithCustomError(bridgeAmoy, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Transfer Limit Tests", function () {
        it("Should reject transfers below minimum limit", async function () {
            const tooSmall = ethers.parseEther("0.009");
            await token.connect(user1).approve(bridgeAmoy.getAddress(), tooSmall);
            
            await expect(
                bridgeAmoy.connect(user1).lockWithRelay(tooSmall, user2.address)
            ).to.be.revertedWith("Amount below minimum");
        });

        it("Should reject transfers above maximum limit", async function () {
            const tooLarge = ethers.parseEther("1001");
            await token.connect(user1).approve(bridgeAmoy.getAddress(), tooLarge);
            
            await expect(
                bridgeAmoy.connect(user1).lockWithRelay(tooLarge, user2.address)
            ).to.be.revertedWith("Amount above maximum");
        });

        it("Should allow transfer within limits", async function () {
            const validAmount = ethers.parseEther("100");
            await token.connect(user1).approve(bridgeAmoy.getAddress(), validAmount);
            
            await expect(
                bridgeAmoy.connect(user1).lockWithRelay(validAmount, user2.address)
            ).to.not.be.reverted;
        });
    });

    describe("Emergency Functions Tests", function () {
        it("Should allow admin to execute emergency withdrawal", async function () {
            const amount = ethers.parseEther("1");
            await token.connect(user1).approve(bridgeAmoy.getAddress(), amount);
            await bridgeAmoy.connect(user1).lockWithRelay(amount, user2.address);

            await expect(
                bridgeAmoy.connect(owner).emergencyWithdraw(
                    await token.getAddress(),
                    owner.address,
                    amount
                )
            ).to.not.be.reverted;
        });

        it("Should prevent non-admin from executing emergency withdrawal", async function () {
            await expect(
                bridgeAmoy.connect(attacker).emergencyWithdraw(
                    await token.getAddress(),
                    attacker.address,
                    ethers.parseEther("1")
                )
            ).to.be.revertedWithCustomError(bridgeAmoy, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Relayer Verification Tests", function () {
        it("Should verify valid relayer with correct proof", async function () {
            expect(
                await relayerManager.verifyRelayer(relayer.address, relayerProof)
            ).to.be.true;
        });

        it("Should reject invalid relayer proof", async function () {
            const invalidProof = merkleTree.getHexProof(keccak256(attacker.address));
            expect(
                await relayerManager.verifyRelayer(attacker.address, invalidProof)
            ).to.be.false;
        });
    });
});