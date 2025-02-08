// async function main() {
//     const [deployer] = await ethers.getSigners();

//     console.log("Deploying contracts with the account:", deployer.address);

//     const Forwarder = await ethers.getContractFactory("Relayer");
//     const forwarder = await Forwarder.deploy();

//     console.log("Relayer contract deployed to:", forwarder.address);
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });


async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // The address of the already deployed Forwarder contract
    const forwarderAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";  // Replace with actual address

    // Deploy the Relayer contract, passing the Forwarder contract address as the constructor argument
    const Relayer = await ethers.getContractFactory("Relayer");
    const relayer = await Relayer.deploy(forwarderAddress);
    console.log("Relayer contract deployed to:", relayer.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
