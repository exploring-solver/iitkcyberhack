// const { ethers, network } = require("hardhat");

// async function main() {
//     // Log the network being used
//     console.log(`Running tests on network: ${network.name}`);

//     // Get the signer (default account)
//     const [sender] = await ethers.getSigners();
//     console.log(`Sender address: ${sender.address}`);

//     // Deploy contracts on localAmoy
//     console.log("\nDeploying contracts on localAmoy...");
//     await network.provider.request({ method: "hardhat_reset", params: [] }); // Reset localAmoy network
//     await deployContracts("localAmoy");

//     // Deploy contracts on localSepolia
//     console.log("\nDeploying contracts on localSepolia...");
//     await network.provider.request({ method: "hardhat_reset", params: [] }); // Reset localSepolia network
//     await deployContracts("localSepolia");

//     // Test the cross-chain bridge workflow
//     console.log("\nTesting cross-chain bridge workflow...");
//     await testBridgeWorkflow();
// }

// async function deployContracts(networkName) {
//     // Set the network
//     await network.provider.request({
//         method: "hardhat_changeNetwork",
//         params: [networkName],
//     });

//     // Deploy Token contract
//     const Token = await ethers.getContractFactory("Token");
//     const token = await Token.deploy("Bridge Token", "BGT", ethers.parseEther("1000000"), sender.address);
//     await token.waitForDeployment();
//     const tokenAddress = await token.getAddress();
//     console.log(`Token deployed at: ${tokenAddress}`);

//     // Deploy Bridge contract
//     const Bridge = await ethers.getContractFactory("Bridge");
//     const bridge = await Bridge.deploy(tokenAddress, sender.address);
//     await bridge.waitForDeployment();
//     const bridgeAddress = await bridge.getAddress();
//     console.log(`Bridge deployed at: ${bridgeAddress}`);

//     // Set bridge as token owner
//     await token.transferOwnership(bridgeAddress);
//     console.log("Bridge set as token owner.");

//     return { token, bridge };
// }

// async function testBridgeWorkflow() {
//     // Connect to localAmoy network
//     await network.provider.request({ method: "hardhat_changeNetwork", params: ["localAmoy"] });
//     const { token: tokenAmoy, bridge: bridgeAmoy } = await deployContracts("localAmoy");

//     // Connect to localSepolia network
//     await network.provider.request({ method: "hardhat_changeNetwork", params: ["localSepolia"] });
//     const { token: tokenSepolia, bridge: bridgeSepolia } = await deployContracts("localSepolia");

//     // Step 1: Approve and lock tokens on localAmoy
//     console.log("\nStep 1: Approve and lock tokens on localAmoy...");
//     await tokenAmoy.approve(bridgeAmoy.target, ethers.parseEther("10"));
//     await bridgeAmoy.lock(ethers.parseEther("10"));
//     let senderBalanceAmoy = await tokenAmoy.balanceOf(sender.address);
//     console.log(`Sender's balance on localAmoy: ${ethers.formatEther(senderBalanceAmoy)}`);

//     // Step 2: Release tokens on localSepolia
//     console.log("\nStep 2: Release tokens on localSepolia...");
//     await bridgeSepolia.release(sender.address, ethers.parseEther("10"));
//     let receiverBalanceSepolia = await tokenSepolia.balanceOf(sender.address);
//     console.log(`Receiver's balance on localSepolia: ${ethers.formatEther(receiverBalanceSepolia)}`);

//     // Step 3: Approve and burn tokens on localSepolia
//     console.log("\nStep 3: Approve and burn tokens on localSepolia...");
//     await tokenSepolia.approve(bridgeSepolia.target, ethers.parseEther("10"));
//     await bridgeSepolia.burn(ethers.parseEther("10"));
//     receiverBalanceSepolia = await tokenSepolia.balanceOf(sender.address);
//     console.log(`Receiver's balance on localSepolia after burn: ${ethers.formatEther(receiverBalanceSepolia)}`);

//     // Step 4: Unlock tokens on localAmoy
//     console.log("\nStep 4: Unlock tokens on localAmoy...");
//     await bridgeAmoy.unlock(sender.address, ethers.parseEther("10"));
//     senderBalanceAmoy = await tokenAmoy.balanceOf(sender.address);
//     console.log(`Sender's balance on localAmoy after unlock: ${ethers.formatEther(senderBalanceAmoy)}`);
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });

const { ethers } = require("hardhat");

async function main() {
    const [sender] = await ethers.getSigners();
    console.log(`Sender address: ${sender.address}`);

    const tokenAmoy = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const bridgeAmoy = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const tokenSepolia = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const bridgeSepolia = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

    // Test bridge workflow
    console.log("\nTesting cross-chain bridge workflow...");
    await testBridgeWorkflow(tokenAmoy, bridgeAmoy, tokenSepolia, bridgeSepolia, sender);
}


async function testBridgeWorkflow(tokenAmoyAddress, bridgeAmoyAddress, tokenSepoliaAddress, bridgeSepoliaAddress, sender) {
    // Step 1: Approve and lock tokens on localAmoy
    console.log("\nStep 1: Approve and lock tokens on localAmoy...");
    const tokenAmoy = await ethers.getContractAt("ERC20", tokenAmoyAddress);
    const bridgeAmoy = await ethers.getContractAt("BridgeAmoy", bridgeAmoyAddress);
    await tokenAmoy.approve(bridgeAmoy.target, ethers.parseEther("10"));
    await bridgeAmoy.lock(ethers.parseEther("10"));
    let senderBalanceAmoy = await tokenAmoy.balanceOf(sender.address);
    console.log(`Sender's balance on localAmoy: ${ethers.formatEther(senderBalanceAmoy)}`);

    // Step 2: Release tokens on localSepolia
    console.log("\nStep 2: Release tokens on localSepolia...");
    const tokenSepolia = await ethers.getContractAt("ERC20", tokenSepoliaAddress);
    const bridgeSepolia = await ethers.getContractAt("BridgeSepolia", bridgeSepoliaAddress); 
    await bridgeSepolia.release(sender.address, ethers.parseEther("10"));
    let receiverBalanceSepolia = await tokenSepolia.balanceOf(sender.address);
    console.log(`Receiver's balance on localSepolia: ${ethers.formatEther(receiverBalanceSepolia)}`);

    // Step 3: Approve and burn tokens on localSepolia
    console.log("\nStep 3: Approve and burn tokens on localSepolia...");
    await tokenSepolia.approve(bridgeSepolia.target, ethers.parseEther("10"));
    await bridgeSepolia.burn(ethers.parseEther("10"));
    receiverBalanceSepolia = await tokenSepolia.balanceOf(sender.address);
    console.log(`Receiver's balance on localSepolia after burn: ${ethers.formatEther(receiverBalanceSepolia)}`);

    // Step 4: Unlock tokens on localAmoy
    console.log("\nStep 4: Unlock tokens on localAmoy...");
    await bridgeAmoy.unlock(sender.address, ethers.parseEther("10"));
    senderBalanceAmoy = await tokenAmoy.balanceOf(sender.address);
    console.log(`Sender's balance on localAmoy after unlock: ${ethers.formatEther(senderBalanceAmoy)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
