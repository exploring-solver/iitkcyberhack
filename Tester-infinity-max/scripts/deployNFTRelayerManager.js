// deployNFTRelayerManager.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

async function deployNFTRelayerManager() {
    const signers = await ethers.getSigners();
    const [deployer] = signers;
    
    const relayers = [
        deployer.address,
        // Add more relayer addresses here
    ];
    
    const leaves = relayers.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = merkleTree.getRoot();

    const NFTRelayerManager = await ethers.getContractFactory("NFTRelayerManager");
    const nftRelayerManager = await NFTRelayerManager.deploy(root, deployer.address);
    await nftRelayerManager.waitForDeployment();
    const nftRelayerManagerAddress = await nftRelayerManager.getAddress();
    
    console.log(`NFTRelayerManager deployed at: ${nftRelayerManagerAddress}`);
    console.log(`NFT Merkle Root: ${merkleTree.getHexRoot()}`);
    
    return { nftRelayerManagerAddress, merkleTree };
}

module.exports = { deployNFTRelayerManager };