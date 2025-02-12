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

    // Deploy Wrapped Token
    console.log("\nDeploying Wrapped Token...");
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy("Wrapped Native Token", "WNTK", deployer.address);
    await wrappedToken.waitForDeployment();
    const wrappedTokenAddress = await wrappedToken.getAddress();
    
    // Verify deployment
    const tokenCode = await ethers.provider.getCode(wrappedTokenAddress);
    if (tokenCode === '0x') throw new Error('Wrapped Token deployment failed');
    console.log(`Wrapped Token deployed at: ${wrappedTokenAddress}`);

    // Deploy Bridge
    console.log("\nDeploying Bridge...");
    const Bridge = await ethers.getContractFactory("BridgeSepolia");
    const bridge = await Bridge.deploy(wrappedTokenAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    
    // Verify deployment
    const bridgeCode = await ethers.provider.getCode(bridgeAddress);
    if (bridgeCode === '0x') throw new Error('Bridge deployment failed');
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as token owner
    await wrappedToken.transferOwnership(bridgeAddress);
    console.log("Bridge set as token owner on Sepolia.");

    // Distribution to public accounts
    const publicAccounts = [
        "0xD57e0418F112bf27912174Db6E53354a1661946A", // Chanmeet 1
        "0xec1FF0DD6C735F756c9360dd7F345210373E1A94", // Chanmeet 2
        "0xB5F23C0Ef0d707B45a8C0f40fF27f7D945EDDd03",  // Aman 1
        "0xf7586028E21F80EbE4aE81df2Cd9f01f155Ee4c4", // Aman 2
        "0xB7Cf4907313428413A0f17A3e6eA1644E0472d68"  //Ansh
    ];

    const distributions = publicAccounts.map((address, index) => ({
        address,
        amount: ["400000", "350000", "250000"][index] || "100000" // Default 100,000 if index > 2
    }));

    console.log("\nMinting wrapped tokens to public accounts...");
    for (const dist of distributions) {
        const mintAmount = ethers.parseEther(dist.amount);
        const mintTx = await bridge.mintWrappedToken(dist.address, mintAmount);
        await mintTx.wait();
        console.log(`✅ Minted ${dist.amount} WNTK to account: ${dist.address}`);
    }
 
    // Verify distribution
    console.log("\nVerifying token distribution");
    for (const dist of distributions) {
        const accountBalance = await wrappedToken.balanceOf(dist.address);
        console.log(`Account balance of ${dist.address}: ${ethers.formatEther(accountBalance)} WNTK`);
    }

    // Save deployment addresses
    const deploymentInfo = {
        network: "sepolia",
        token: {
            address: wrappedTokenAddress,
            name: "Wrapped Native Token",
            symbol: "WNTK"
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
        path.join(deploymentsDir, 'sepolia-deployment.json'), 
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Verify contracts on Etherscan
    console.log("\nVerifying contracts on Etherscan...");
    // try {
    //     await hre.run("verify:verify", {
    //         address: wrappedTokenAddress,
    //         constructorArguments: ["Wrapped Native Token", "WNTK", deployer.address]
    //     });
    //     console.log("Wrapped Token verified");

    //     await hre.run("verify:verify", {
    //         address: bridgeAddress,
    //         constructorArguments: [wrappedTokenAddress, deployer.address]
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