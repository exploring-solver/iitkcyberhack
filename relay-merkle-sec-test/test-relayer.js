const { Web3 } = require('web3');
const BridgeRelayer = require('./BridgeRelayer');
const TokenABI = require('../Tester-2/artifacts/contracts/WrappedToken.sol/WrappedToken.json').abi;

async function testBridgeRelayer() {
    const web3Amoy = new Web3('http://localhost:8545');
    const web3Sepolia = new Web3('http://localhost:8546');

    // Get test accounts
    const accounts = await web3Amoy.eth.getAccounts();
    const user = accounts[1]; // Use second account as user
    const amount = web3Amoy.utils.toWei('1', 'ether');

    // Initialize contracts
    const amoyToken = new web3Amoy.eth.Contract(
        TokenABI,
        '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Replace with your token address
    );

    console.log('Starting relayer test...');

    try {
        // 1. Approve tokens for bridge
        console.log('Approving tokens...');
        await amoyToken.methods.approve(
            '0x09635F643e140090A9A8Dcd712eD6285858ceBef', // Amoy bridge address
            amount
        ).send({ from: user });
        console.log('Tokens approved');

        // 2. Lock tokens in bridge
        const amoyBridge = new web3Amoy.eth.Contract(
            AmoyBridgeABI,
            '0x09635F643e140090A9A8Dcd712eD6285858ceBef'
        );

        console.log('Locking tokens...');
        const lockTx = await amoyBridge.methods.lock(amount)
            .send({ from: user });
        console.log('Tokens locked, transaction:', lockTx.transactionHash);

        // 3. Wait for relayer to process
        console.log('Waiting for relayer to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Check wrapped token balance on Sepolia
        const sepoliaToken = new web3Sepolia.eth.Contract(
            TokenABI,
            '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        );

        const balance = await sepoliaToken.methods.balanceOf(user).call();
        console.log('Final balance on Sepolia:', web3Sepolia.utils.fromWei(balance, 'ether'));

        if (balance === amount) {
            console.log('Test successful! Tokens bridged correctly');
        } else {
            console.log('Test failed: Balance mismatch');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test
testBridgeRelayer().catch(console.error);