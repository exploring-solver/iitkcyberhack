const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    deployTokenContracts,
    deployNFTContracts,
    deployBridgeContracts,
    setupRoles,
    setupBridgeConnections
} = require("./helpers");

describe("Relayer Integration", function () {
    let deployer, user, relayer;
    let contracts = {};

    beforeEach(async function () {
        [deployer, user, relayer] = await ethers.getSigners();
        
        // Deploy all contracts
        const { token, wrappedToken } = await deployTokenContracts(deployer);
        const { nativeNFT, wrappedNFT } = await deployNFTContracts(deployer);
        const bridges = await deployBridgeContracts(token, wrappedToken, nativeNFT, wrappedNFT);

        contracts = {
            token,
            wrappedToken,
            nativeNFT,
            wrappedNFT,
            ...bridges
        };

        await setupRoles(contracts, relayer);
        await setupBridgeConnections(contracts);
    });

    describe("Token Bridge Flow", function () {
        it("should handle complete token bridge flow", async function () {
            const amount = ethers.parseEther("100");
            
            // 1. Mint tokens to user
            await contracts.token.connect(deployer).mint(user.address, amount);
            
            // 2. User approves and locks tokens
            await contracts.token.connect(user).approve(
                await contracts.bridgeAmoy.getAddress(),
                amount
            );
            await contracts.bridgeAmoy.connect(user).lock(amount);
            
            // 3. Relayer observes event and creates signature
            const nonce = await contracts.bridgeAmoy.nonce();
            const message = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256", "uint256"],
                [await contracts.wrappedToken.getAddress(), user.address, amount, nonce]
            );
            const signature = await relayer.signMessage(ethers.getBytes(message));
            
            // 4. Relayer releases wrapped tokens
            await contracts.bridgeSepolia.connect(relayer).release(
                user.address,
                amount,
                nonce,
                signature
            );
            
            // 5. Verify final state
            expect(await contracts.wrappedToken.balanceOf(user.address)).to.equal(amount);
            
            // 6. User burns wrapped tokens
            await contracts.wrappedToken.connect(user).approve(
                await contracts.bridgeSepolia.getAddress(),
                amount
            );
            await contracts.bridgeSepolia.connect(user).burn(amount);
            
            // 7. Relayer observes burn event and unlocks original tokens
            const burnNonce = await contracts.bridgeSepolia.nonce();
            const burnMessage = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256", "uint256"],
                [await contracts.token.getAddress(), user.address, amount, burnNonce]
            );
            const burnSignature = await relayer.signMessage(ethers.getBytes(burnMessage));
            
            await contracts.bridgeAmoy.connect(relayer).unlock(
                user.address,
                amount,
                burnNonce,
                burnSignature
            );
            
            // 8. Verify final state after complete flow
            expect(await contracts.token.balanceOf(user.address)).to.equal(amount);
            expect(await contracts.wrappedToken.balanceOf(user.address)).to.equal(0);
        });
    });

    // ... continue with NFT flow test ...
}); 