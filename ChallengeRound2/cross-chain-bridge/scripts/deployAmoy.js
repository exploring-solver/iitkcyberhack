require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    console.log(`Deploying contracts on LocalAmoy with account: ${deployer.address}`);

    // Deploy Native Token
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Native Token", "NTK", 1000000, deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Native Token deployed at: ${tokenAddress}`);

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("BridgeAmoy");
    const bridge = await Bridge.deploy(tokenAddress, deployer.address);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log(`Bridge deployed at: ${bridgeAddress}`);

    // Set bridge as token owner
    await token.transferOwnership(bridgeAddress);
    console.log("Bridge set as token owner on LocalAmoy.");

    // Distribute tokens to test accounts
    const network = await ethers.provider.getNetwork();
    if (network.chainId === 31337) { // Check if we're on local hardhat network
        console.log("\nDistributing test tokens to accounts...");
        const mintAmount = ethers.parseEther("1000"); // 1000 tokens

        // Transfer tokens to top 5 accounts
        for (let i = 1; i <= 5; i++) {
            if (signers[i]) {
                const tx = await token.transfer(signers[i].address, mintAmount);
                await tx.wait();
                console.log(`Transferred ${ethers.formatEther(mintAmount)} tokens to ${signers[i].address}`);
            }
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});