const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("Bridge System", function () {
    let Token, WrappedToken, BridgeAmoy, BridgeSepolia;
    let token, wrappedToken, bridgeAmoy, bridgeSepolia;
    let owner, user1, user2, relayer;
    const INITIAL_SUPPLY = ethers.parseEther("1000000");

    beforeEach(async function () {
        [owner, user1, user2, relayer] = await ethers.getSigners();

        // Deploy Token on Amoy
        Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Native Token", "NTV", INITIAL_SUPPLY);
        await token.waitForDeployment();

        // Deploy Wrapped Token on Sepolia
        WrappedToken = await ethers.getContractFactory("WrappedToken");
        wrappedToken = await WrappedToken.deploy(
            "Wrapped Token",
            "WNTV",
            await token.getAddress(),
            1 // originalChainId
        );
        await wrappedToken.waitForDeployment();

        // Deploy Bridges
        BridgeAmoy = await ethers.getContractFactory("BridgeAmoy");
        bridgeAmoy = await BridgeAmoy.deploy(await token.getAddress());
        await bridgeAmoy.waitForDeployment();

        BridgeSepolia = await ethers.getContractFactory("BridgeSepolia");
        bridgeSepolia = await BridgeSepolia.deploy(await wrappedToken.getAddress());
        await bridgeSepolia.waitForDeployment();

        // Setup roles and permissions
        await token.grantRole(await token.MINTER_ROLE(), await bridgeAmoy.getAddress());
        await token.grantRole(await token.BURNER_ROLE(), await bridgeAmoy.getAddress());
        await wrappedToken.grantRole(await wrappedToken.MINTER_ROLE(), await bridgeSepolia.getAddress());
        await wrappedToken.grantRole(await wrappedToken.BURNER_ROLE(), await bridgeSepolia.getAddress());

        // Add relayer to both bridges
        await bridgeAmoy.addRelayer(relayer.address);
        await bridgeSepolia.addRelayer(relayer.address);

        // Set remote bridges
        await bridgeAmoy.setRemoteBridge(await bridgeSepolia.getAddress());
        await bridgeSepolia.setRemoteBridge(await bridgeAmoy.getAddress());

        // Transfer some tokens to user1
        await token.transfer(user1.address, ethers.parseEther("1000"));
    });

    describe("Bridge Operations", function () {
        it("should successfully bridge tokens from Amoy to Sepolia", async function () {
            console.log("\n=== Testing Amoy to Sepolia Bridge ===");
            const amount = ethers.parseEther("100");
            console.log("Transfer amount:", ethers.formatEther(amount), "tokens");

            // Log initial balances
            const initialSourceBalance = await token.balanceOf(user1.address);
            const initialTargetBalance = await wrappedToken.balanceOf(user1.address);
            console.log("Initial balances:", {
                source: ethers.formatEther(initialSourceBalance),
                target: ethers.formatEther(initialTargetBalance)
            });

            await token.connect(user1).approve(await bridgeAmoy.getAddress(), amount);
            console.log("Token approval granted to bridge");

            const lockTx = await bridgeAmoy.connect(user1).lock(amount);
            const receipt = await lockTx.wait();
            console.log("Tokens locked, tx hash:", lockTx.hash);

            const lockEvent = receipt.logs.find(log =>
                log.fragment && log.fragment.name === 'Locked'
            );
            const transferId = lockEvent.args.transferId;
            console.log("Transfer ID:", transferId);

            // Create and log merkle tree details
            const leaf = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [user1.address, amount, transferId]
            );
            console.log("Generated leaf:", leaf);

            const merkleTree = new MerkleTree([leaf], keccak256, {
                sortPairs: true,
                hashLeaves: false
            });
            const proof = merkleTree.getHexProof(leaf);
            const root = merkleTree.getHexRoot();

            console.log("Merkle tree details:", {
                root: root,
                proof: proof,
                leaf: leaf
            });

            // Verify proof locally before sending
            const isValidLocally = merkleTree.verify(proof, leaf, root);
            console.log("Local proof verification:", isValidLocally);

            await bridgeSepolia.connect(relayer).updateMerkleRoot(root);
            console.log("Merkle root updated on Sepolia bridge");

            await bridgeSepolia.connect(relayer).release(
                user1.address,
                amount,
                proof,
                transferId
            );
            console.log("Tokens released on Sepolia");

            // Log final balances
            const finalSourceBalance = await token.balanceOf(user1.address);
            const finalTargetBalance = await wrappedToken.balanceOf(user1.address);
            console.log("Final balances:", {
                source: ethers.formatEther(finalSourceBalance),
                target: ethers.formatEther(finalTargetBalance)
            });

            expect(finalTargetBalance).to.equal(amount);
        });

        it("should successfully bridge tokens from Sepolia to Amoy", async function () {
            console.log("\n=== Testing Sepolia to Amoy Bridge ===");
            // First bridge to Sepolia to get wrapped tokens
            const initialAmount = ethers.parseEther("100");
            await token.connect(user1).approve(await bridgeAmoy.getAddress(), initialAmount);
            const lockTx = await bridgeAmoy.connect(user1).lock(initialAmount);
            const lockReceipt = await lockTx.wait();
            const lockEvent = lockReceipt.logs.find(log =>
                log.fragment && log.fragment.name === 'Locked'
            );

            // Setup merkle proof for initial transfer
            const initialLeaf = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [user1.address, initialAmount, lockEvent.args.transferId]
            );
            const initialTree = new MerkleTree([initialLeaf], keccak256, {
                sortPairs: true,
                hashLeaves: false
            });
            await bridgeSepolia.connect(relayer).updateMerkleRoot(initialTree.getHexRoot());
            await bridgeSepolia.connect(relayer).release(
                user1.address,
                initialAmount,
                initialTree.getHexProof(initialLeaf),
                lockEvent.args.transferId
            );

            // Add logging for return transfer
            console.log("\n--- Starting return transfer ---");
            const returnAmount = ethers.parseEther("50");
            console.log("Return amount:", ethers.formatEther(returnAmount), "tokens");

            // Log balances before return
            const beforeReturnWrapped = await wrappedToken.balanceOf(user1.address);
            const beforeReturnNative = await token.balanceOf(user1.address);
            console.log("Balances before return:", {
                wrapped: ethers.formatEther(beforeReturnWrapped),
                native: ethers.formatEther(beforeReturnNative)
            });

            await wrappedToken.connect(user1).approve(await bridgeSepolia.getAddress(), returnAmount);
            const burnTx = await bridgeSepolia.connect(user1).burn(returnAmount);
            const burnReceipt = await burnTx.wait();
            const burnEvent = burnReceipt.logs.find(log =>
                log.fragment && log.fragment.name === 'Burned'
            );
            const returnTransferId = burnEvent.args.transferId;

            // Create merkle proof for return transfer
            const returnLeaf = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [user1.address, returnAmount, returnTransferId]
            );
            const returnTree = new MerkleTree([returnLeaf], keccak256, {
                sortPairs: true,
                hashLeaves: false
            });
            const returnProof = returnTree.getHexProof(returnLeaf);

            console.log("Return transfer ID:", returnTransferId);
            console.log("Return merkle proof:", returnProof);
            console.log("Return merkle root:", returnTree.getHexRoot());

            // Update merkle root and unlock tokens
            await bridgeAmoy.connect(relayer).updateMerkleRoot(returnTree.getHexRoot());
            await bridgeAmoy.connect(relayer).unlock(
                user1.address,
                returnAmount,
                returnProof,
                returnTransferId
            );

            // Verify final balances
            const finalWrappedBalance = await wrappedToken.balanceOf(user1.address);
            const finalNativeBalance = await token.balanceOf(user1.address);

            expect(finalWrappedBalance).to.equal(initialAmount - returnAmount);
            const thousand = ethers.parseEther("1000")
            const expected = BigInt(thousand) - BigInt(initialAmount) + BigInt(returnAmount);
            expect(finalNativeBalance).to.equal(expected);
        });

        it("should reject invalid merkle proofs", async function () {
            console.log("\n=== Testing Invalid Merkle Proofs ===");
            const amount = ethers.parseEther("100");
            await token.connect(user1).approve(await bridgeAmoy.getAddress(), amount);

            const lockTx = await bridgeAmoy.connect(user1).lock(amount);
            const receipt = await lockTx.wait();
            const transferId = receipt.logs.find(log =>
                log.fragment && log.fragment.name === 'Locked'
            ).args.transferId;

            // Create invalid proof
            const invalidLeaf = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [user2.address, amount, transferId] // Different user
            );
            const merkleTree = new MerkleTree([invalidLeaf], keccak256, {
                sortPairs: true,
                hashLeaves: false
            });
            const invalidProof = merkleTree.getHexProof(invalidLeaf);

            // Update merkle root
            await bridgeSepolia.connect(relayer).updateMerkleRoot(merkleTree.getHexRoot());

            console.log("Valid user address:", user1.address);
            console.log("Invalid user address:", user2.address);
            console.log("Invalid merkle proof:", invalidProof);
            console.log("Invalid merkle root:", merkleTree.getHexRoot());

            // Attempt to release with invalid proof should fail
            await expect(
                bridgeSepolia.connect(relayer).release(
                    user1.address,
                    amount,
                    invalidProof,
                    transferId
                )
            ).to.be.revertedWith("Invalid merkle proof");
        });

        // Add a new test to specifically verify merkle proof generation
        it("should generate consistent merkle proofs", async function () {
            console.log("\n=== Testing Merkle Proof Consistency ===");
            const amount = ethers.parseEther("100");
            const mockTransferId = ethers.id("test");

            // Generate leaf data
            const leafData = {
                user: user1.address,
                amount: amount,
                transferId: mockTransferId
            };
            console.log("Leaf data:", leafData);

            // Generate leaf in different ways to verify consistency
            const leaf1 = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [leafData.user, leafData.amount, leafData.transferId]
            );

            const leaf2 = keccak256(
                ethers.solidityPacked(
                    ["address", "uint256", "bytes32"],
                    [leafData.user, leafData.amount, leafData.transferId]
                )
            );

            console.log("Leaf generation comparison:", {
                ethersLeaf: leaf1,
                keccakLeaf: '0x' + leaf2.toString('hex')
            });

            expect(leaf1.toLowerCase()).to.equal('0x' + leaf2.toString('hex'));
            console.log("Leaf generation methods match!");
        });
    });
});