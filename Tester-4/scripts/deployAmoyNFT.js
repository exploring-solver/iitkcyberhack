require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const [deployer, acc1, acc2, acc3, acc4] = signers;
    console.log(`Deploying NFT contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy Native NFT
    const NativeNFT = await ethers.getContractFactory("NativeNFT");
    const nativeNFT = await NativeNFT.deploy("Native NFT", "NNFT", deployer.address);
    await nativeNFT.waitForDeployment();
    const nativeNFTAddress = await nativeNFT.getAddress();
    console.log(`Native NFT deployed at: ${nativeNFTAddress}`);

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("BridgeAmoyNFT");
    const bridge = await Bridge.deploy(nativeNFTAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as NFT owner
    await nativeNFT.transferOwnership(bridgeAddress);
    console.log("Bridge set as NFT owner on LocalAmoy");

    // Distribute NFTs unevenly to first 5 accounts
    const distributions = [
        { account: deployer, count: 5 },  // 5 NFTs
        { account: acc1, count: 3 },      // 3 NFTs
        { account: acc2, count: 2 },      // 2 NFTs
        { account: acc3, count: 1 },      // 1 NFT
        { account: acc4, count: 1 }       // 1 NFT
    ];

    for (const dist of distributions) {
        for (let i = 0; i < dist.count; i++) {
            const tx = await bridge.mint(dist.account.address);
            await tx.wait();
            console.log(`✅ Minted NFT #${i + 1} to account: ${dist.account.address}`);
        }
        console.log(`Total NFTs minted to ${dist.account.address}: ${dist.count}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});