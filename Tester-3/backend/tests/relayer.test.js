const { Web3 } = require('web3');
const BridgeRelayer = require('../services/BridgeRelayer');
const { config, NETWORKS, CONTRACT_ADDRESSES } = require('../config');

const TokenABI = require('../artifacts/Token.sol/Token.json').abi;
const WrappedTokenABI = require('../artifacts/WrappedToken.sol/WrappedToken.json').abi;
const NFTTokenABI = require('../artifacts/NativeNFT.sol/NativeNFT.json').abi;

async function testRelayer() {
    console.log('Starting relayer tests...');
    console.log('Network Configuration:', NETWORKS);
    console.log('Contract Addresses:', CONTRACT_ADDRESSES);

    const web3Amoy = new Web3(NETWORKS.amoy.rpcUrl);
    const web3Sepolia = new Web3(NETWORKS.sepolia.rpcUrl);
    let relayer = null; // Declare relayer here at the top level of the function

    console.log('Web3 instances created');

    try {
        // Verify network connections
        const amoyNetworkId = await web3Amoy.eth.net.getId();
        const sepoliaNetworkId = await web3Sepolia.eth.net.getId();
        console.log('Connected to networks:', {
            amoy: amoyNetworkId,
            sepolia: sepoliaNetworkId
        });

        // Initialize contracts
        console.log('Initializing contracts...');
        
        const amoyToken = new web3Amoy.eth.Contract(
            TokenABI,
            CONTRACT_ADDRESSES.amoy.token
        );
        console.log('Amoy token contract initialized');

        const sepoliaToken = new web3Sepolia.eth.Contract(
            WrappedTokenABI,
            CONTRACT_ADDRESSES.sepolia.token
        );
        console.log('Sepolia token contract initialized');

        const amoyNFT = new web3Amoy.eth.Contract(
            NFTTokenABI,
            CONTRACT_ADDRESSES.amoy.nft
        );
        console.log('Amoy NFT contract initialized');

        // Verify contract deployments
        try {
            const amoyTokenSymbol = await amoyToken.methods.symbol().call();
            const sepoliaTokenSymbol = await sepoliaToken.methods.symbol().call();
            console.log('Token symbols:', {
                amoy: amoyTokenSymbol,
                sepolia: sepoliaTokenSymbol
            });
        } catch (error) {
            console.error('Error verifying token contracts:', error);
            throw new Error('Contract verification failed');
        }

        // Initialize relayer with correct config structure
        console.log('Initializing relayer...');
        relayer = new BridgeRelayer({ config }); // Assign to the previously declared variable
        await relayer.start();
        console.log('Relayer started successfully');

        // Test accounts
        const testAccount = web3Amoy.eth.accounts.privateKeyToAccount(
            '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
        );
        const receiverAccount = web3Sepolia.eth.accounts.privateKeyToAccount(
            '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
        );

        console.log('Test accounts:', {
            sender: testAccount.address,
            receiver: receiverAccount.address
        });

        // Add accounts to web3 instances
        web3Amoy.eth.accounts.wallet.add(testAccount);
        web3Sepolia.eth.accounts.wallet.add(receiverAccount);

        // Run tests
        await testTokenBridge(
            relayer,
            amoyToken,
            sepoliaToken,
            testAccount,
            receiverAccount,
            web3Amoy
        );

        // await testNFTBridge(
        //     relayer,
        //     amoyNFT,
        //     testAccount,
        //     receiverAccount,
        //     web3Amoy
        // );

        await testEventProcessing(relayer);
        await testErrorHandling(relayer);

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        if (relayer) {
            await relayer.stop();
            console.log('Relayer stopped');
        }
    }
}

async function testTokenBridge(relayer, amoyToken, sepoliaToken, testAccount, receiverAccount, web3) {
    console.log('Starting token bridge test...');
    console.log('Contracts:', {
        amoyToken: amoyToken.options.address,
        sepoliaToken: sepoliaToken.options.address
    });

    const amount = web3.utils.toWei('1', 'ether');
    console.log('Test amount:', amount);

    try {
        // 1. Check initial balances
        console.log('Checking initial balances...');
        const initialSourceBalance = await amoyToken.methods.balanceOf(testAccount.address).call();
        console.log('Initial source balance fetched:', initialSourceBalance);
        
        const initialTargetBalance = await sepoliaToken.methods.balanceOf(receiverAccount.address).call();
        console.log('Initial target balance fetched:', initialTargetBalance);

        console.log('Initial balances:', {
            source: web3.utils.fromWei(initialSourceBalance.toString(), 'ether'),
            target: web3.utils.fromWei(initialTargetBalance.toString(), 'ether')
        });

        // 2. Lock tokens
        const lockTx = await amoyToken.methods.approve(config.amoy.bridgeAddress, amount)
            .send({ from: testAccount.address });
        console.log('Token approval tx:', lockTx.transactionHash);

        // 3. Wait for relayer to process
        console.log('Waiting for relayer to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Verify final balances
        const finalSourceBalance = await amoyToken.methods.balanceOf(testAccount.address).call();
        const finalTargetBalance = await sepoliaToken.methods.balanceOf(receiverAccount.address).call();

        console.log('Final source balance:', web3.utils.fromWei(finalSourceBalance.toString(), 'ether'));
        console.log('Final target balance:', web3.utils.fromWei(finalTargetBalance.toString(), 'ether'));

        // 5. Verify transfer was processed
        const transferProcessed = await relayer.getTransferStatus(lockTx.transactionHash);
        console.log('Transfer status:', transferProcessed);
    } catch (error) {
        console.error('Token bridge test failed:', error);
        throw error;
    }
}

// async function testNFTBridge(relayer, amoyNFT, testAccount, receiverAccount, web3) {
//     // 1. Mint test NFT
//     const mintTx = await amoyNFT.methods.mint(testAccount.address)
//         .send({ from: testAccount.address });
//     const tokenId = mintTx.events.Transfer.returnValues.tokenId;

//     console.log('Minted NFT ID:', tokenId);

//     // 2. Approve and lock NFT
//     await amoyNFT.methods.approve(config.amoy.nftBridgeAddress, tokenId)
//         .send({ from: testAccount.address });

//     const lockTx = await amoyNFT.methods.transferFrom(
//         testAccount.address,
//         config.amoy.nftBridgeAddress,
//         tokenId
//     ).send({ from: testAccount.address });

//     console.log('NFT lock tx:', lockTx.transactionHash);

//     // 3. Wait for relayer to process
//     console.log('Waiting for relayer to process...');
//     await new Promise(resolve => setTimeout(resolve, 5000));

//     // 4. Verify NFT ownership
//     const finalOwner = await amoyNFT.methods.ownerOf(tokenId).call();
//     console.log('Final NFT owner:', finalOwner);

//     // 5. Verify transfer was processed
//     const transferProcessed = await relayer.getTransferStatus(lockTx.transactionHash);
//     console.log('Transfer status:', transferProcessed);
// }

async function testEventProcessing(relayer) {
    // 1. Test block processing
    const processedBlocks = await relayer.storage.loadLastProcessedBlocks();
    console.log('Processed blocks:', processedBlocks);

    // 2. Test pending transfers
    const pendingTransfers = {
        amoy: relayer.pendingTransfers.amoy.size,
        sepolia: relayer.pendingTransfers.sepolia.size
    };
    console.log('Pending transfers:', pendingTransfers);

    // 3. Test merkle trees
    const merkleTrees = {
        amoy: {
            status: relayer.merkleTrees.amoy ? 'Created' : 'Not created',
            root: relayer.merkleRoots.amoy
        },
        sepolia: {
            status: relayer.merkleTrees.sepolia ? 'Created' : 'Not created',
            root: relayer.merkleRoots.sepolia
        }
    };
    console.log('Merkle trees:', JSON.stringify(merkleTrees, null, 2));

    // 4. Test merkle tree update
    const testTransfer = {
        user: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        amount: '1000000000000000000',
        nonce: '1',
        timestamp: Date.now()
    };

    // Update merkle trees with test transfer
    await relayer.updateMerkleTree('amoy', [testTransfer]);
    await relayer.updateMerkleTree('sepolia', [testTransfer]);

    // Verify roots were updated
    console.log('Updated Merkle roots:', {
        amoy: relayer.merkleRoots.amoy,
        sepolia: relayer.merkleRoots.sepolia
    });
}

async function testErrorHandling(relayer) {
    // 1. Test invalid transfer
    try {
        await relayer.relayTransfer('invalid_chain', {}, '0x0');
        console.error('Expected error was not thrown');
    } catch (error) {
        console.log('Successfully caught invalid chain error');
    }

    // 2. Test invalid merkle proof
    try {
        await relayer.updateMerkleTree('amoy', []);
        console.log('Successfully handled empty transfer list');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run tests
if (require.main === module) {
    testRelayer().catch(console.error);
}

module.exports = {
    testRelayer,
    testTokenBridge,
    // testNFTBridge,
    testEventProcessing,
    testErrorHandling
};