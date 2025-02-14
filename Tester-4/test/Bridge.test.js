const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    deployTokenContracts,
    deployNFTContracts,
    deployBridgeContracts,
    setupRoles,
    setupBridgeConnections
} = require("./helpers");

describe("Bridge System", function () {
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

        // Setup roles and connections
        await setupRoles(contracts, relayer);
        await setupBridgeConnections(contracts);

        // Mint some tokens to user
        await contracts.token.mint(user.address, ethers.parseEther("1000"));
    });

    describe("Token Bridge", function () {
        it("should lock tokens on Amoy and mint wrapped tokens on Sepolia", async function () {
            const amount = ethers.parseEther("100");
            
            // Approve tokens
            await contracts.token.connect(user).approve(
                await contracts.bridgeAmoy.getAddress(),
                amount
            );

            // Lock tokens
            await contracts.bridgeAmoy.connect(user).lock(amount);

            // Get the nonce
            const nonce = await contracts.bridgeAmoy.nonce();

            // Create signature
            const message = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256", "uint256"],
                [await contracts.wrappedToken.getAddress(), user.address, amount, nonce]
            );
            const signature = await relayer.signMessage(ethers.getBytes(message));

            // Release wrapped tokens
            await contracts.bridgeSepolia.connect(relayer).release(
                user.address,
                amount,
                nonce,
                signature
            );

            // Check balances
            expect(await contracts.wrappedToken.balanceOf(user.address)).to.equal(amount);
        });
    });

    describe("NFT Bridge", function () {
        it("should lock NFT on Amoy and mint wrapped NFT on Sepolia", async function () {
            // Mint NFT to user
            await contracts.nativeNFT.connect(deployer).mint(user.address);
            const tokenId = 1;

            // Approve NFT
            await contracts.nativeNFT.connect(user).approve(
                await contracts.bridgeAmoyNFT.getAddress(),
                tokenId
            );

            // Lock NFT
            await contracts.bridgeAmoyNFT.connect(user).lock(tokenId);

            // Get the nonce
            const nonce = await contracts.bridgeAmoyNFT.nonce();

            // Create signature
            const message = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256", "uint256"],
                [await contracts.wrappedNFT.getAddress(), user.address, tokenId, nonce]
            );
            const signature = await relayer.signMessage(ethers.getBytes(message));

            // Release wrapped NFT
            await contracts.bridgeSepoliaNFT.connect(relayer).release(
                user.address,
                tokenId,
                nonce,
                signature
            );

            // Check ownership
            expect(await contracts.wrappedNFT.ownerOf(tokenId)).to.equal(user.address);
        });
    });

    describe("Token Bridge Security", function () {
        it("should prevent unauthorized relayers", async function () {
            const amount = ethers.parseEther("100");
            const [_, unauthorizedRelayer] = await ethers.getSigners();

            await contracts.token.connect(user).approve(
                await contracts.bridgeAmoy.getAddress(),
                amount
            );

            await contracts.bridgeAmoy.connect(user).lock(amount);
            const nonce = await contracts.bridgeAmoy.nonce();

            const message = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256", "uint256"],
                [await contracts.wrappedToken.getAddress(), user.address, amount, nonce]
            );
            const signature = await unauthorizedRelayer.signMessage(ethers.getBytes(message));

            await expect(
                contracts.bridgeSepolia.connect(unauthorizedRelayer).release(
                    user.address,
                    amount,
                    nonce,
                    signature
                )
            ).to.be.revertedWith("AccessControl:");
        });

        it("should prevent replay attacks", async function () {
            const amount = ethers.parseEther("100");
            
            await contracts.token.connect(user).approve(
                await contracts.bridgeAmoy.getAddress(),
                amount
            );

            await contracts.bridgeAmoy.connect(user).lock(amount);
            const nonce = await contracts.bridgeAmoy.nonce();

            const message = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256", "uint256"],
                [await contracts.wrappedToken.getAddress(), user.address, amount, nonce]
            );
            const signature = await relayer.signMessage(ethers.getBytes(message));

            // First release should succeed
            await contracts.bridgeSepolia.connect(relayer).release(
                user.address,
                amount,
                nonce,
                signature
            );

            // Second release should fail
            await expect(
                contracts.bridgeSepolia.connect(relayer).release(
                    user.address,
                    amount,
                    nonce,
                    signature
                )
            ).to.be.revertedWith("Nonce already processed");
        });
    });

    describe("NFT Bridge Security", function () {
        it("should prevent unauthorized NFT minting", async function () {
            const tokenId = 1;
            const [_, unauthorized] = await ethers.getSigners();

            await expect(
                contracts.nativeNFT.connect(unauthorized).mint(user.address)
            ).to.be.revertedWith("AccessControl:");
        });

        it("should prevent unauthorized NFT burning", async function () {
            const tokenId = 1;
            await contracts.nativeNFT.connect(deployer).mint(user.address);

            await expect(
                contracts.nativeNFT.connect(user).burn(tokenId)
            ).to.be.revertedWith("AccessControl:");
        });
    });

    describe("Bridge Administration", function () {
        it("should allow admin to add new relayers", async function () {
            const [_, newRelayer] = await ethers.getSigners();
            
            await contracts.bridgeAmoy.connect(deployer).addRelayer(newRelayer.address);
            
            const hasRole = await contracts.bridgeAmoy.hasRole(
                await contracts.bridgeAmoy.RELAYER_ROLE(),
                newRelayer.address
            );
            
            expect(hasRole).to.be.true;
        });

        it("should allow admin to remove relayers", async function () {
            await contracts.bridgeAmoy.connect(deployer).removeRelayer(relayer.address);
            
            const hasRole = await contracts.bridgeAmoy.hasRole(
                await contracts.bridgeAmoy.RELAYER_ROLE(),
                relayer.address
            );
            
            expect(hasRole).to.be.false;
        });

        it("should allow admin to pause/unpause bridges", async function () {
            // Pause token
            await contracts.token.connect(deployer).pause();
            
            const amount = ethers.parseEther("100");
            await expect(
                contracts.token.connect(deployer).mint(user.address, amount)
            ).to.be.revertedWith("Pausable: paused");

            // Unpause token
            await contracts.token.connect(deployer).unpause();
            await expect(
                contracts.token.connect(deployer).mint(user.address, amount)
            ).to.not.be.reverted;
        });
    });
}); 