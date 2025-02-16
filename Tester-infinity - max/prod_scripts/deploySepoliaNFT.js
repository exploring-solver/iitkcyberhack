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

    // Deploy Wrapped NFT
    console.log("\nDeploying Wrapped NFT...");
    const WrappedNFT = await ethers.getContractFactory("WrappedNFT");
    const wrappedNFT = await WrappedNFT.deploy("Wrapped Native NFT", "WNNFT", deployer.address);
    await wrappedNFT.waitForDeployment();
    const wrappedNFTAddress = await wrappedNFT.getAddress();
    
    // Verify deployment
    const nftCode = await ethers.provider.getCode(wrappedNFTAddress);
    if (nftCode === '0x') throw new Error('Wrapped NFT deployment failed');
    console.log(`Wrapped NFT deployed at: ${wrappedNFTAddress}`);

    // Deploy Bridge
    console.log("\nDeploying Bridge...");
    const Bridge = await ethers.getContractFactory("BridgeSepoliaNFT");
    const bridge = await Bridge.deploy(wrappedNFTAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    
    // Verify deployment
    const bridgeCode = await ethers.provider.getCode(bridgeAddress);
    if (bridgeCode === '0x') throw new Error('Bridge deployment failed');
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as NFT owner
    await wrappedNFT.transferOwnership(bridgeAddress);
    console.log("Bridge set as NFT owner on Sepolia");

    // Note: No initial distribution for Wrapped NFTs as they will be minted when bridged from Amoy
    console.log("\nNo initial NFT distribution on Sepolia as NFTs will be minted during bridging");

    // Save deployment addresses
    const deploymentInfo = {
        network: "sepolia",
        nft: {
            address: wrappedNFTAddress,
            name: "Wrapped Native NFT",
            symbol: "WNNFT"
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
        path.join(deploymentsDir, 'sepolia-nft-deployment.json'), 
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Verify contracts on Etherscan
    console.log("\nVerifying contracts on Etherscan...");
    // try {
    //     await hre.run("verify:verify", {
    //         address: wrappedNFTAddress,
    //         constructorArguments: ["Wrapped Native NFT", "WNNFT", deployer.address]
    //     });
    //     console.log("Wrapped NFT verified");

    //     await hre.run("verify:verify", {
    //         address: bridgeAddress,
    //         constructorArguments: [wrappedNFTAddress, deployer.address]
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