// deployRelayerManager.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

async function deployRelayerManager() {
    const signers = await ethers.getSigners();
    const [deployer] = signers;
    
    // Create merkle tree for relayers
    const relayers = [
        deployer.address,
        // Add more relayer addresses here
    ];
    
    const leaves = relayers.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = merkleTree.getRoot();

    // Deploy RelayerManager
    const RelayerManager = await ethers.getContractFactory("RelayerManager");
    const relayerManager = await RelayerManager.deploy(root, deployer.address); // Added deployer as admin
    await relayerManager.waitForDeployment();
    const relayerManagerAddress = await relayerManager.getAddress();
    
    console.log(`RelayerManager deployed at: ${relayerManagerAddress}`);
    console.log(`Merkle Root: ${merkleTree.getHexRoot()}`);
    
    return { relayerManagerAddress, merkleTree };
}

module.exports = { deployRelayerManager };