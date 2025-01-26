const Forwarder = artifacts.require("Forwarder");
const TestToken = artifacts.require("TestToken");

module.exports = async function(deployer, network, accounts) {
  // Deploy Forwarder
  await deployer.deploy(Forwarder);
  const forwarder = await Forwarder.deployed();
  console.log("Forwarder deployed at:", forwarder.address);

  // Deploy TestToken with initial supply of 1,000,000 tokens
  const initialSupply = 1000000;
  await deployer.deploy(TestToken, initialSupply);
  const testToken = await TestToken.deployed();
  console.log("TestToken deployed at:", testToken.address);

  // Mint some tokens to other accounts for testing
  if (network === 'development') {
    const mintAmount = web3.utils.toWei('1000', 'ether'); // 1000 tokens
    for (let i = 1; i < 5; i++) {
      await testToken.mint(accounts[i], mintAmount);
      console.log(`Minted ${mintAmount} tokens to ${accounts[i]}`);
    }
  }
}; 