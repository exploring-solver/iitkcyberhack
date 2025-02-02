require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    console.log("\n=== Checking Balances for Accounts ===\n");

    // Get contract factories and ABIs
    const Token = await ethers.getContractFactory("Token");
    const NativeNFT = await ethers.getContractFactory("NativeNFT");
    const BridgeAmoy = await ethers.getContractFactory("BridgeAmoy");
    const BridgeAmoyNFT = await ethers.getContractFactory("BridgeAmoyNFT");

    // Contract addresses from your deployment
    const tokenAddress = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
    const nftAddress = "0x09635F643e140090A9A8Dcd712eD6285858ceBef";
    const bridgeAddress = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";
    const bridgeNFTAddress = "0xc5a5C42992dECbae36851359345FE25997F5C42d";

    try {
        // Get contract instances
        const token = Token.attach(tokenAddress);
        const nativeNFT = NativeNFT.attach(nftAddress);
        const bridge = BridgeAmoy.attach(bridgeAddress);
        const bridgeNFT = BridgeAmoyNFT.attach(bridgeNFTAddress);

        console.log("Contract Addresses:");
        console.log("Token:", tokenAddress);
        console.log("NFT:", nftAddress);
        console.log("Bridge:", bridgeAddress);
        console.log("Bridge NFT:", bridgeNFTAddress);
        console.log("\n=== Account Balances ===\n");

        // Check balances for first 10 accounts
        for (let i = 0; i < 10 && i < signers.length; i++) {
            const account = signers[i];
            const address = account.address;
            
            try {
                // Get token balance
                const tokenBalance = await token.balanceOf(address);
                const formattedBalance = ethers.formatEther(tokenBalance);

                // Get NFT balance
                const nftBalance = await nativeNFT.balanceOf(address);
                
                // Get owned NFT IDs
                const ownedNFTs = [];
                if (nftBalance > 0) {
                    for (let tokenId = 1; tokenId <= nftBalance.toNumber(); tokenId++) {
                        try {
                            const owner = await nativeNFT.ownerOf(tokenId);
                            if (owner.toLowerCase() === address.toLowerCase()) {
                                ownedNFTs.push(tokenId);
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                }

                // Get ETH balance
                const ethBalance = await ethers.provider.getBalance(address);
                const formattedEthBalance = ethers.formatEther(ethBalance);

                console.log(`Account ${i}: ${address}`);
                console.log(`ETH Balance: ${formattedEthBalance} ETH`);
                console.log(`Token Balance: ${formattedBalance} NTK`);
                console.log(`NFT Balance: ${nftBalance.toString()} NFTs`);
                if (ownedNFTs.length > 0) {
                    console.log(`Owned NFT IDs: ${ownedNFTs.join(', ')}`);
                }
                console.log('------------------------');
            } catch (error) {
                console.log(`Error checking balance for account ${address}:`, error.message);
            }
        }

        // Check bridge contract balances
        try {
            const bridgeTokenBalance = await token.balanceOf(bridgeAddress);
            const bridgeNFTBalance = await nativeNFT.balanceOf(bridgeAddress);
            
            console.log("\n=== Bridge Contract Balances ===\n");
            console.log(`Bridge Token Balance: ${ethers.formatEther(bridgeTokenBalance)} NTK`);
            console.log(`Bridge NFT Balance: ${bridgeNFTBalance.toString()} NFTs`);
        } catch (error) {
            console.log("Error checking bridge balances:", error.message);
        }

    } catch (error) {
        console.error("Error initializing contracts:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });