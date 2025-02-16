async function main() {
    // Deploy DecentralizedRelayer first
    const DecentralizedRelayer = await ethers.getContractFactory("DecentralizedRelayer");
    const relayer = await DecentralizedRelayer.deploy();
    await relayer.deployed();
    console.log("DecentralizedRelayer deployed to:", relayer.address);

    // Deploy other contracts with relayer address
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Native Token", "NT", initialSupply);
    
    const BridgeAmoy = await ethers.getContractFactory("BridgeAmoy");
    const bridgeAmoy = await BridgeAmoy.deploy(token.address, relayer.address);
    
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy("Wrapped Token", "WT", token.address, chainIdAmoy);
    
    const BridgeSepolia = await ethers.getContractFactory("BridgeSepolia");
    const bridgeSepolia = await BridgeSepolia.deploy(wrappedToken.address, relayer.address);

    // Setup roles
    await relayer.addRelayer(relayer1Address);
    await relayer.addRelayer(relayer2Address);
    await relayer.addRelayer(relayer3Address);
}