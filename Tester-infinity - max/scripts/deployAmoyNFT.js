// deployAmoyNFT.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { deployRelayerManager } = require("./deployRelayerManager");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying contracts on Amoy with account: ${deployer.address}`);

    // First deploy RelayerManager
    const { relayerManagerAddress } = await deployRelayerManager();

    // Deploy Native NFT
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(
        "Native NFT Collection",
        "NNFT",
        deployer.address
    );
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log(`Native NFT deployed at: ${nftAddress}`);

    // Deploy Bridge V2
    const BridgeV2 = await ethers.getContractFactory("BridgeAmoyNFTV2");
    const bridgeV2 = await BridgeV2.deploy(
        nftAddress,
        relayerManagerAddress,
        deployer.address
    );
    await bridgeV2.waitForDeployment();
    const bridgeV2Address = await bridgeV2.getAddress();
    console.log(`NFT BridgeV2 deployed at: ${bridgeV2Address}`);

    // Set bridge as NFT owner
    await nft.transferOwnership(bridgeV2Address);
    console.log("BridgeV2 set as NFT owner on Amoy.");

    // Mint NFTs to accounts
    console.log("\nMinting NFTs to accounts...");
    const distributions = [
        { account: deployer, count: 4 },
        { account: acc1, count: 3 },
        { account: acc2, count: 2 },
        { account: acc3, count: 2 },
        { account: acc4, count: 1 }
    ];

    const mintedTokens = {};
    for (const dist of distributions) {
        mintedTokens[dist.account.address] = [];
        for (let i = 0; i < dist.count; i++) {
            const mintTx = await nft.mint(dist.account.address);
            const receipt = await mintTx.wait();
            
            // Get the tokenId from the transfer event
            const transferEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
            );
            const tokenId = transferEvent.topics[3];
            mintedTokens[dist.account.address].push(tokenId);
            
            console.log(`✅ Minted NFT #${tokenId} to account: ${dist.account.address}`);
        }
    }

    // Save deployment addresses and minted tokens to a file
    const fs = require('fs');
    const deploymentInfo = {
        network: 'amoy',
        nft: nftAddress,
        bridge: bridgeV2Address,
        relayerManager: relayerManagerAddress,
        mintedTokens
    };

    fs.writeFileSync(
        'deployment-amoy-nft.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});