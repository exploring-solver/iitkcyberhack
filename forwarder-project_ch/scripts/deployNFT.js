const hre = require("hardhat");

async function main() {
    const NFT = await hre.ethers.getContractFactory("TestNFT");

    // Deploy the contract
    const nft = await NFT.deploy();

    // Wait for the deployment to be mined
    await nft.deploymentTransaction().wait();

    // Retrieve and log the deployed contract's address
    console.log("TestNFT deployed to:", nft.target);

    // Mint a token to an address (for example, the deployer's address)
    const [deployer] = await hre.ethers.getSigners();
    await nft.safeMint(deployer.address);
    console.log("NFT minted to:", deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
