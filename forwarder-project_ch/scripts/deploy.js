// const hre = require("hardhat");

// async function main() {
//     const Forwarder = await hre.ethers.getContractFactory("Forwarder");
//     const forwarder = await Forwarder.deploy();

//     await forwarder.deployed();
//     console.log("Forwarder deployed to:", forwarder.address);
// }

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });


const hre = require("hardhat");

async function main() {
    // Retrieve the contract factory
    const Forwarder = await hre.ethers.getContractFactory("Forwarder");

    // Deploy the contract
    const forwarder = await Forwarder.deploy();

    // Wait for the deployment to be mined
    await forwarder.waitForDeployment();

    // Retrieve and log the deployed contract's address
    const forwarderAddress = await forwarder.getAddress();
    console.log("Forwarder deployed to:", forwarderAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
