// test/nftSecurity.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("NFT Bridge Security Tests", function () {
    let NFT, WrappedNFT, BridgeAmoyNFT, BridgeSepoliaNFT, NFTRelayerManager;
    let nft, wrappedNft, bridgeAmoyNft, bridgeSepoliaNft, nftRelayerManager;
    let owner, user1, user2, relayer, attacker;
    let merkleTree, relayerProof;
    let tokenId;

    beforeEach(async function () {
        [owner, user1, user2, relayer, attacker] = await ethers.getSigners();

        // Setup merkle tree for relayer
        const relayers = [relayer.address];
        const leaves = relayers.map(addr => keccak256(addr));
        merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = merkleTree.getRoot();
        relayerProof = merkleTree.getHexProof(keccak256(relayer.address));

        // Deploy contracts
        NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy("Native NFT", "NNFT", owner.address);

        WrappedNFT = await ethers.getContractFactory("WrappedNFT");
        wrappedNft = await WrappedNFT.deploy("Wrapped NFT", "WNFT", owner.address);

        NFTRelayerManager = await ethers.getContractFactory("NFTRelayerManager");
        nftRelayerManager = await NFTRelayerManager.deploy(root, owner.address);

        BridgeAmoyNFT = await ethers.getContractFactory("BridgeAmoyNFTV2");
        bridgeAmoyNft = await BridgeAmoyNFT.deploy(
            await nft.getAddress(),
            await nftRelayerManager.getAddress(),
            owner.address
        );

        BridgeSepoliaNFT = await ethers.getContractFactory("BridgeSepoliaNFTV2");
        bridgeSepoliaNft = await BridgeSepoliaNFT.deploy(
            await wrappedNft.getAddress(),
            await nftRelayerManager.getAddress(),
            owner.address
        );

        // Setup roles
        await nft.grantRole(await nft.MINTER_ROLE(), bridgeAmoyNft.getAddress());
        await nft.grantRole(await nft.BURNER_ROLE(), bridgeAmoyNft.getAddress());
        await wrappedNft.grantRole(await wrappedNft.MINTER_ROLE(), bridgeSepoliaNft.getAddress());
        await wrappedNft.grantRole(await wrappedNft.BURNER_ROLE(), bridgeSepoliaNft.getAddress());

        // Mint NFT to user1
        const mintTx = await nft.connect(owner).mint(user1.address);
        const receipt = await mintTx.wait();
        tokenId = receipt.logs[0].args[2]; // Get tokenId from Transfer event
    });

    describe("Access Control Tests", function () {
        it("Should prevent non-admin from granting roles", async function () {
            const minterRole = await nft.MINTER_ROLE();
            await expect(
                nft.connect(attacker).grantRole(minterRole, attacker.address)
            ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
        });

        it("Should prevent unauthorized minting", async function () {
            await expect(
                nft.connect(attacker).mint(attacker.address)
            ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
        });

        it("Should prevent non-bridge from minting wrapped NFTs", async function () {
            await expect(
                wrappedNft.connect(attacker).mint(attacker.address, 1)
            ).to.be.revertedWithCustomError(wrappedNft, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Emergency Pause Tests", function () {
        it("Should allow admin to pause and unpause NFT bridge", async function () {
            // Pause the bridge
            await bridgeAmoyNft.connect(owner).pause();
            expect(await bridgeAmoyNft.paused()).to.be.true;

            // Approve NFT
            await nft.connect(user1).approve(bridgeAmoyNft.getAddress(), tokenId);

            // Try to bridge while paused
            await expect(
                bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address)
            ).to.be.revertedWithCustomError(bridgeAmoyNft, "EnforcedPause");

            // Unpause and verify bridge works
            await bridgeAmoyNft.connect(owner).unpause();
            expect(await bridgeAmoyNft.paused()).to.be.false;

            await expect(
                bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address)
            ).to.not.be.reverted;
        });

        it("Should prevent non-admin from pausing", async function () {
            await expect(
                bridgeAmoyNft.connect(attacker).pause()
            ).to.be.revertedWithCustomError(bridgeAmoyNft, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Bridge Security Tests", function () {
        it("Should prevent bridging of non-existent tokens", async function () {
            const nonExistentTokenId = 999999;
            await expect(
                bridgeAmoyNft.connect(user1).lockWithRelay(nonExistentTokenId, user2.address)
            ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
        });

        it("Should prevent double bridging of tokens", async function () {
            // First bridge
            await nft.connect(user1).approve(bridgeAmoyNft.getAddress(), tokenId);
            await bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address);
    
            // Try to bridge again
            await expect(
                bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address)
            ).to.be.revertedWith("Token already bridged");
        });

        it("Should prevent unauthorized token transfers", async function () {
            await expect(
                bridgeAmoyNft.connect(attacker).lockWithRelay(tokenId, attacker.address)
            ).to.be.revertedWith("Not token owner");
        });
    });

    describe("Relayer Tests", function () {
        it("Should prevent non-relayer from executing bridge transfers", async function () {
            // Setup bridge transfer
            await nft.connect(user1).approve(bridgeAmoyNft.getAddress(), tokenId);
            const lockTx = await bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address);
            const receipt = await lockTx.wait();
            const requestId = receipt.logs[1].args[0]; // Get requestId from event

            // Try to release with non-relayer
            await expect(
                bridgeSepoliaNft.connect(attacker).release(
                    requestId,
                    user2.address,
                    tokenId,
                    relayerProof
                )
            ).to.be.revertedWith("Invalid relayer");
        });

        it("Should prevent replay attacks", async function () {
            // Setup and execute bridge transfer
            await nft.connect(user1).approve(bridgeAmoyNft.getAddress(), tokenId);
            const lockTx = await bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address);
            const receipt = await lockTx.wait();
            const requestId = receipt.logs[1].args[0];

            // Execute release with valid relayer
            await bridgeSepoliaNft.connect(relayer).release(
                requestId,
                user2.address,
                tokenId,
                relayerProof
            );

            // Try to execute same release again
            await expect(
                bridgeSepoliaNft.connect(relayer).release(
                    requestId,
                    user2.address,
                    tokenId,
                    relayerProof
                )
            ).to.be.revertedWith("Request already processed");
        });
    });

    describe("Emergency Recovery Tests", function () {
        it("Should allow admin to recover stuck NFTs", async function () {
            // Lock NFT in bridge
            await nft.connect(user1).approve(bridgeAmoyNft.getAddress(), tokenId);
            await bridgeAmoyNft.connect(user1).lockWithRelay(tokenId, user2.address);

            // Emergency recovery
            await expect(
                bridgeAmoyNft.connect(owner).emergencyWithdraw(tokenId, owner.address)
            ).to.not.be.reverted;

            // Verify NFT ownership
            expect(await nft.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should prevent non-admin from using emergency recovery", async function () {
            await expect(
                bridgeAmoyNft.connect(attacker).emergencyWithdraw(tokenId, attacker.address)
            ).to.be.revertedWithCustomError(bridgeAmoyNft, "AccessControlUnauthorizedAccount");
        });
    });

    describe("NFT Relayer Manager Tests", function () {
        it("Should allow admin to update relayer root", async function () {
            const newRelayers = [user1.address];
            const newLeaves = newRelayers.map(addr => keccak256(addr));
            const newMerkleTree = new MerkleTree(newLeaves, keccak256, { sortPairs: true });
            const newRoot = newMerkleTree.getRoot();

            await expect(
                nftRelayerManager.connect(owner).updateRelayerRoot(newRoot)
            ).to.not.be.reverted;
        });

        it("Should prevent non-admin from updating relayer root", async function () {
            const newRoot = ethers.randomBytes(32);
            await expect(
                nftRelayerManager.connect(attacker).updateRelayerRoot(newRoot)
            ).to.be.revertedWithCustomError(nftRelayerManager, "AccessControlUnauthorizedAccount");
        });

        it("Should correctly verify relayer proofs", async function () {
            const validProof = merkleTree.getHexProof(keccak256(relayer.address));
            const invalidProof = merkleTree.getHexProof(keccak256(attacker.address));

            expect(await nftRelayerManager.verifyRelayer(relayer.address, validProof)).to.be.true;
            expect(await nftRelayerManager.verifyRelayer(attacker.address, invalidProof)).to.be.false;
        });
    });
});