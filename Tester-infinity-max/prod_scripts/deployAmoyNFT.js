require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = ethers.getDefaultProvider();

    // Gas price check
    const gasPrice = (await provider.getFeeData()).gasPrice;
    console.log(`Current gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    // Confirm deployment account (This is the account set in hardhat.config)
    const deployer = (await ethers.getSigners())[0];
    console.log(`Deploying contracts with account: ${deployer.address}`);
    
    // Get deployer balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

    // Deploy Native NFT
    console.log("\nDeploying Native NFT...");
    const NativeNFT = await ethers.getContractFactory("NativeNFT");
    const nativeNFT = await NativeNFT.deploy("Native NFT", "NNFT", deployer.address);
    await nativeNFT.waitForDeployment();
    const nativeNFTAddress = await nativeNFT.getAddress();
    
    // Verify deployment
    const nftCode = await ethers.provider.getCode(nativeNFTAddress);
    if (nftCode === '0x') throw new Error('Native NFT deployment failed');
    console.log(`Native NFT deployed at: ${nativeNFTAddress}`);

    // Deploy Bridge
    console.log("\nDeploying Bridge...");
    const Bridge = await ethers.getContractFactory("BridgeAmoyNFT");
    const bridge = await Bridge.deploy(nativeNFTAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    
    // Verify deployment
    const bridgeCode = await ethers.provider.getCode(bridgeAddress);
    if (bridgeCode === '0x') throw new Error('Bridge deployment failed');
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as NFT owner
    await nativeNFT.transferOwnership(bridgeAddress);
    console.log("Bridge set as NFT owner on Amoy");

    // Distribution to public accounts
    const publicAccounts = [
        "0xD57e0418F112bf27912174Db6E53354a1661946A", // Chanmeet 1
        "0xec1FF0DD6C735F756c9360dd7F345210373E1A94", // Chanmeet 2
        "0xB5F23C0Ef0d707B45a8C0f40fF27f7D945EDDd03",  // Aman 1
        "0xf7586028E21F80EbE4aE81df2Cd9f01f155Ee4c4", // Aman 2
        "0xB7Cf4907313428413A0f17A3e6eA1644E0472d68"  //Ansh
    ];

    const nftDistributions = publicAccounts.map((address, index) => ({
        address,
        count: [5, 3, 2][index] || 1 // Default 1 NFT if index > 2
    }));

    console.log("\nMinting NFTs to public accounts...");
    for (const dist of nftDistributions) {
        for (let i = 0; i < dist.count; i++) {
            const tx = await bridge.mint(dist.address);
            await tx.wait();
            console.log(`✅ Minted NFT #${i + 1} to account: ${dist.address}`);
        }
        console.log(`Total NFTs minted to ${dist.address}: ${dist.count}`);
    }

    // Save deployment addresses
    const deploymentInfo = {
        network: "amoy",
        nft: {
            address: nativeNFTAddress,
            name: "Native NFT",
            symbol: "NNFT"
        },
        bridge: {
            address: bridgeAddress
        },
        timestamp: new Date().toISOString()
    };

    const deploymentsDir = path.join(__dirname, 'deployments');
    if (!fs.existsSync(deploymentsDir)){
        fs.mkdirSync(deploymentsDir);
    }
    fs.writeFileSync(
        path.join(deploymentsDir, 'amoy-nft-deployment.json'), 
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Verify contracts on Etherscan
    console.log("\nVerifying contracts on Etherscan...");
    // try {
    //     await hre.run("verify:verify", {
    //         address: nativeNFTAddress,
    //         constructorArguments: ["Native NFT", "NNFT", deployer.address]
    //     });
    //     console.log("Native NFT verified");

    //     await hre.run("verify:verify", {
    //         address: bridgeAddress,
    //         constructorArguments: [nativeNFTAddress, deployer.address]
    //     });
    //     console.log("Bridge verified");
    // } catch (error) {
    //     console.log("Verification error:", error);
    // }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });