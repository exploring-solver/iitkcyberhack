const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const crypto = require('crypto');


describe("MerkleVerifier", function () {
  let merkleVerifier;
  let owner;
  let addr1;
  let addr2;
  let merkleTree;
  let leaves;
  let root;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Create Merkle tree
    leaves = ['leaf1', 'leaf2', 'leaf3'].map(v => keccak256(v));
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    root = merkleTree.getRoot();

    const MerkleVerifier = await ethers.getContractFactory("MerkleVerifier");
    merkleVerifier = await MerkleVerifier.deploy(root);
    await merkleVerifier.waitForDeployment();
  });

  describe("Verification", function () {
    it("Should verify valid proof", async function () {
      const leaf = leaves[0];
      const proof = merkleTree.getHexProof(leaf);
      
      expect(await merkleVerifier.verify(proof, leaf))
        .to.equal(true);
    });

    it("Should reject invalid proof", async function () {
      const leaf = leaves[0];
      const proof = merkleTree.getHexProof(leaf);
      const invalidLeaf = keccak256('invalid');
      
      expect(await merkleVerifier.verify(proof, invalidLeaf))
        .to.equal(false);
    });

    it("Should verify multiple proofs", async function () {
      const proofs = leaves.map(leaf => merkleTree.getHexProof(leaf));
      
      const results = await merkleVerifier.verifyMultiple(proofs, leaves);
      expect(results).to.deep.equal([true, true, true]);
    });
  });

  describe("Admin functions", function () {
    it("Should update merkle root", async function () {
      const newLeaves = ['new1', 'new2'].map(v => keccak256(v));
      const newTree = new MerkleTree(newLeaves, keccak256);
      const newRoot = newTree.getRoot();

      await expect(merkleVerifier.updateMerkleRoot(newRoot))
        .to.emit(merkleVerifier, "MerkleRootUpdated")
        .withArgs(root, newRoot);
    });

    it("Should reject unauthorized root update", async function () {
      const newRoot = crypto.randomBytes(32);
      
      await expect(
          merkleVerifier.connect(addr1).updateMerkleRoot(newRoot)
      ).to.be.revertedWithCustomError(merkleVerifier, "OwnableUnauthorizedAccount")
       .withArgs(addr1.address);
  });
  });
});