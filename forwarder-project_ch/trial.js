const { ethers } = require("hardhat");

async function main() {
  // Replace with your contract address and name
  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const contractName = "Rel";

  // Load the ABI and Bytecode from Hardhat's artifacts
  const ContractFactory = await ethers.getContractFactory(contractName);

  // Attach the contract at the deployed address
  const contract = await ContractFactory.attach(contractAddress);

  // Example: Fetch some details
  console.log("Contract Address:", contract.address);
  console.log("Deployer Balance:", (await ethers.provider.getBalance(contract.address)).toString());

  // List all available contract functions
  console.log("Available Functions:", Object.keys(contract.functions));

  // Example: Fetch a state variable or call a function
  try {
    const exampleValue = await contract.somePublicVariableOrFunction();
    console.log("Example Value:", exampleValue.toString());
  } catch (err) {
    console.log("Error accessing variable or function:", err.message);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
