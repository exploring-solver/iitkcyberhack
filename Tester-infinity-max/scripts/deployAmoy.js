// deployAmoy.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { deployRelayerManager } = require("./deployRelayerManager");
const { deployNFTRelayerManager } = require("./deployNFTRelayerManager");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on Amoy with account: ${deployer.address}`);

    // Deploy both relayer managers
    const { relayerManagerAddress } = await deployRelayerManager();
    const { nftRelayerManagerAddress } = await deployNFTRelayerManager();

    // Deploy Native Token with AccessControl
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
        "Native Token",
        "NTK",
        1000000,
        deployer.address // admin
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Deploy Native NFT
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(
        "Native NFT",
        "NNFT",
        deployer.address // admin
    );
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log(`Native NFT deployed at: ${nftAddress}`);

    // Deploy Bridges with minimum and maximum transfer amounts for ERC20
    const minTransfer = ethers.parseEther("0.01");
    const maxTransfer = ethers.parseEther("1000");

    const BridgeV2 = await ethers.getContractFactory("BridgeAmoyV2");
    const bridgeV2 = await BridgeV2.deploy(
        tokenAddress,
        relayerManagerAddress,
        deployer.address, // admin
        minTransfer,
        maxTransfer
    );
    await bridgeV2.waitForDeployment();
    const bridgeV2Address = await bridgeV2.getAddress();

    // Deploy NFT Bridge
    const NFTBridgeV2 = await ethers.getContractFactory("BridgeAmoyNFTV2");
    const nftBridgeV2 = await NFTBridgeV2.deploy(
        nftAddress,
        nftRelayerManagerAddress,
        deployer.address // admin
    );
    await nftBridgeV2.waitForDeployment();
    const nftBridgeV2Address = await nftBridgeV2.getAddress();

    // Grant roles to bridges
    await token.grantRole(await token.MINTER_ROLE(), bridgeV2Address);
    await token.grantRole(await token.BURNER_ROLE(), bridgeV2Address);
    await nft.grantRole(await nft.MINTER_ROLE(), nftBridgeV2Address);
    await nft.grantRole(await nft.BURNER_ROLE(), nftBridgeV2Address);

    // Distribution logic remains the same...

    // Distribute tokens
    console.log("\nDistributing native tokens to accounts...");
    const distributions = [
        { account: deployer, amount: "400000" },
        { account: acc1, amount: "350000" },
        { account: acc2, amount: "175000" },
        { account: acc3, amount: "50000" },
        { account: acc4, amount: "25000" }
    ];

    for (const dist of distributions) {
        const transferAmount = ethers.parseEther(dist.amount);
        const tx = await token.transfer(dist.account.address, transferAmount);
        await tx.wait();
        console.log(`✅ Transferred ${dist.amount} NTK to account: ${dist.account.address}`);
    }

    // Mint NFTs to accounts
    console.log("\nMinting NFTs to accounts...");
    const NFTdistributions = [
        { account: deployer, count: 4 },
        { account: acc1, count: 3 },
        { account: acc2, count: 2 },
        { account: acc3, count: 2 },
        { account: acc4, count: 1 }
    ];

    for (const dist of NFTdistributions) {
        for (let i = 0; i < dist.count; i++) {
            const mintTx = await nft.mint(dist.account.address);
            const receipt = await mintTx.wait();
            
            // Get the tokenId from the transfer event
            const transferEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
            );
            const tokenId = transferEvent.topics[3];
            
            console.log(`✅ Minted NFT #${tokenId} to account: ${dist.account.address}`);
        }
    }

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        network: 'amoy',
        token: tokenAddress,
        nft: nftAddress,
        bridge: bridgeV2Address,
        nftBridge: nftBridgeV2Address,
        relayerManager: relayerManagerAddress,
        nftRelayerManager: nftRelayerManagerAddress
    };

    fs.writeFileSync(
        './deployment-amoy.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});