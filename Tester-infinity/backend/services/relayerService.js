// relayerService.js
const ethers = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const AmoyBridgeABI = require('../contracts/BridgeAmoyV2.sol/BridgeAmoyV2.json').abi;
const SepoliaBridgeABI = require('../contracts/BridgeSepoliaV2.sol/BridgeSepoliaV2.json').abi;

class RelayerService {
    constructor(config) {
        this.amoyProvider = new ethers.JsonRpcProvider(config.amoyRpc);
        this.sepoliaProvider = new ethers.JsonRpcProvider(config.sepoliaRpc);
        this.relayerWallet = new ethers.Wallet(config.privateKey);
        this.bridges = config.bridges;
        this.merkleTree = this.setupMerkleTree(config.relayers);
    }

    setupMerkleTree(relayers) {
        const leaves = relayers.map(addr => keccak256(addr));
        return new MerkleTree(leaves, keccak256, { sortPairs: true });
    }

    getMerkleProof(relayerAddress) {
        const leaf = keccak256(relayerAddress);
        return this.merkleTree.getHexProof(leaf);
    }

    async monitorAmoyEvents() {
        const amoyBridge = new ethers.Contract(
            this.bridges.amoy,
            AmoyBridgeABI,
            this.amoyProvider
        );

        amoyBridge.on('LockRequested', async (requestId, user, recipient, amount) => {
            try {
                const proof = this.getMerkleProof(this.relayerWallet.address);
                
                // Execute on Sepolia
                const sepoliaBridge = new ethers.Contract(
                    this.bridges.sepolia,
                    SepoliaBridgeABI,
                    this.relayerWallet.connect(this.sepoliaProvider)
                );

                await sepoliaBridge.release(
                    requestId,
                    recipient,
                    amount,
                    proof,
                    { gasLimit: 300000 }
                );

                console.log(`Processed Amoy->Sepolia transfer: ${requestId}`);
            } catch (error) {
                console.error(`Error processing transfer ${requestId}:`, error);
            }
        });
    }

    async monitorSepoliaEvents() {
        const sepoliaBridge = new ethers.Contract(
            this.bridges.sepolia,
            SepoliaBridgeABI,
            this.sepoliaProvider
        );

        sepoliaBridge.on('ReleaseRequested', async (requestId, recipient, amount) => {
            try {
                const proof = this.getMerkleProof(this.relayerWallet.address);
                
                // Execute on Amoy
                const amoyBridge = new ethers.Contract(
                    this.bridges.amoy,
                    AmoyBridgeABI,
                    this.relayerWallet.connect(this.amoyProvider)
                );

                await amoyBridge.unlock(
                    requestId,
                    recipient,
                    amount,
                    proof,
                    { gasLimit: 300000 }
                );

                console.log(`Processed Sepolia->Amoy transfer: ${requestId}`);
            } catch (error) {
                console.error(`Error processing transfer ${requestId}:`, error);
            }
        });
    }

    start() {
        this.monitorAmoyEvents();
        this.monitorSepoliaEvents();
        console.log('Relayer service started');
    }
}

module.exports = RelayerService;