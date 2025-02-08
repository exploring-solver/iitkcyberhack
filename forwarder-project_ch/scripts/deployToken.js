const hre = require("hardhat");

async function main() {
    // const Token = await hre.ethers.getContractFactory("TestToken");
    // const token = await Token.deploy(1000000); // Deploy with 1,000,000 tokens

    // await token.deployed();

    // console.log("TestToken deployed to:", token.address);
    const Token = await hre.ethers.getContractFactory("TestToken");

    // Deploy the contract
    const token = await Token.deploy(1000000);

    // Wait for the deployment to be mined
    await token.waitForDeployment();

    // Retrieve and log the deployed contract's address
    const tokenAddress = await token.getAddress();
    console.log("TestToken deployed to:", tokenAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
