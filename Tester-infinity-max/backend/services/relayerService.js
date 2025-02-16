// relayerService.js
const ethers = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const AmoyBridgeABI = require('../contracts/BridgeAmoyV2.sol/BridgeAmoyV2.json').abi;
const SepoliaBridgeABI = require('../contracts/BridgeSepoliaV2.sol/BridgeSepoliaV2.json').abi;
const AmoyNFTBridgeABI = require('../contracts/BridgeAmoyNFTV2.sol/BridgeAmoyNFTV2.json').abi;
const SepoliaNFTBridgeABI = require('../contracts/BridgeSepoliaNFTV2.sol/BridgeSepoliaNFTV2.json').abi;

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

    // ERC20 Event Monitoring
    async monitorAmoyERC20Events() {
        const amoyBridge = new ethers.Contract(
            this.bridges.amoy.erc20,
            AmoyBridgeABI,
            this.amoyProvider
        );

        amoyBridge.on('LockRequested', async (requestId, user, recipient, amount) => {
            try {
                const proof = this.getMerkleProof(this.relayerWallet.address);
                
                const sepoliaBridge = new ethers.Contract(
                    this.bridges.sepolia.erc20,
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

                console.log(`Processed Amoy->Sepolia ERC20 transfer: ${requestId}`);
            } catch (error) {
                console.error(`Error processing ERC20 transfer ${requestId}:`, error);
            }
        });
    }

    async monitorSepoliaERC20Events() {
        const sepoliaBridge = new ethers.Contract(
            this.bridges.sepolia.erc20,
            SepoliaBridgeABI,
            this.sepoliaProvider
        );

        sepoliaBridge.on('ReleaseRequested', async (requestId, recipient, amount) => {
            try {
                const proof = this.getMerkleProof(this.relayerWallet.address);
                
                const amoyBridge = new ethers.Contract(
                    this.bridges.amoy.erc20,
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

                console.log(`Processed Sepolia->Amoy ERC20 transfer: ${requestId}`);
            } catch (error) {
                console.error(`Error processing ERC20 transfer ${requestId}:`, error);
            }
        });
    }

    // ERC721 Event Monitoring
    async monitorAmoyNFTEvents() {
        const amoyNFTBridge = new ethers.Contract(
            this.bridges.amoy.erc721,
            AmoyNFTBridgeABI,
            this.amoyProvider
        );

        amoyNFTBridge.on('LockRequested', async (requestId, user, recipient, tokenId) => {
            try {
                const proof = this.getMerkleProof(this.relayerWallet.address);
                
                const sepoliaNFTBridge = new ethers.Contract(
                    this.bridges.sepolia.erc721,
                    SepoliaNFTBridgeABI,
                    this.relayerWallet.connect(this.sepoliaProvider)
                );

                await sepoliaNFTBridge.release(
                    requestId,
                    recipient,
                    tokenId,
                    proof,
                    { gasLimit: 300000 }
                );

                console.log(`Processed Amoy->Sepolia NFT transfer: ${requestId} (TokenId: ${tokenId})`);
            } catch (error) {
                console.error(`Error processing NFT transfer ${requestId}:`, error);
            }
        });
    }

    async monitorSepoliaNFTEvents() {
        const sepoliaNFTBridge = new ethers.Contract(
            this.bridges.sepolia.erc721,
            SepoliaNFTBridgeABI,
            this.sepoliaProvider
        );

        sepoliaNFTBridge.on('ReleaseRequested', async (requestId, recipient, tokenId) => {
            try {
                const proof = this.getMerkleProof(this.relayerWallet.address);
                
                const amoyNFTBridge = new ethers.Contract(
                    this.bridges.amoy.erc721,
                    AmoyNFTBridgeABI,
                    this.relayerWallet.connect(this.amoyProvider)
                );

                await amoyNFTBridge.unlock(
                    requestId,
                    recipient,
                    tokenId,
                    proof,
                    { gasLimit: 300000 }
                );

                console.log(`Processed Sepolia->Amoy NFT transfer: ${requestId} (TokenId: ${tokenId})`);
            } catch (error) {
                console.error(`Error processing NFT transfer ${requestId}:`, error);
            }
        });
    }

    async getTransferStatus(requestId, network, type = 'erc20') {
        try {
            const provider = network === 'amoy' ? this.amoyProvider : this.sepoliaProvider;
            const bridgeAddress = network === 'amoy' 
                ? (type === 'erc20' ? this.bridges.amoy.erc20 : this.bridges.amoy.erc721)
                : (type === 'erc20' ? this.bridges.sepolia.erc20 : this.bridges.sepolia.erc721);
            const abi = network === 'amoy'
                ? (type === 'erc20' ? AmoyBridgeABI : AmoyNFTBridgeABI)
                : (type === 'erc20' ? SepoliaBridgeABI : SepoliaNFTBridgeABI);

            const bridge = new ethers.Contract(bridgeAddress, abi, provider);
            const processed = await bridge.processedRequests(requestId);
            
            return {
                processed,
                bridge: bridgeAddress,
                type
            };
        } catch (error) {
            console.error(`Error getting transfer status:`, error);
            throw error;
        }
    }

    start() {
        this.monitorAmoyERC20Events();
        this.monitorSepoliaERC20Events();
        this.monitorAmoyNFTEvents();
        this.monitorSepoliaNFTEvents();
        console.log('Relayer service started - monitoring both ERC20 and ERC721 transfers');
    }
}

module.exports = RelayerService;

