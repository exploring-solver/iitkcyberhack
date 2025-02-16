const { Web3 } = require('web3');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const RelayerStorage = require('./RelayerStorage');
const AmoyBridgeABI = require('../artifacts/BridgeAmoy.sol/BridgeAmoy.json').abi;
const SepoliaBridgeABI = require('../artifacts/BridgeSepolia.sol/BridgeSepolia.json').abi;
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');

class BridgeRelayer {
    constructor({ config }) {
        if (!config) {
            throw new Error('Config is required for BridgeRelayer');
        }

        this.config = config;

        // Initialize storage first
        this.storage = new RelayerStorage(config);

        console.log("Initializing BridgeRelayer with config:", {
            amoy: {
                ...config.amoy,
                relayerPrivateKey: '***hidden***'
            },
            sepolia: {
                ...config.sepolia,
                relayerPrivateKey: '***hidden***'
            }
        });

        // Initialize Web3 instances
        this.networks = {
            amoy: new Web3(config.amoy.rpcUrl),
            sepolia: new Web3(config.sepolia.rpcUrl)
        };

        // Initialize contracts
        this.contracts = {
            amoy: {
                bridge: new this.networks.amoy.eth.Contract(
                    config.amoy.bridgeABI,
                    config.amoy.bridgeAddress
                )
            },
            sepolia: {
                bridge: new this.networks.sepolia.eth.Contract(
                    config.sepolia.bridgeABI,
                    config.sepolia.bridgeAddress
                )
            }
        };

        // Add accounts to web3 instances
        this.networks.amoy.eth.accounts.privateKeyToAccount(config.amoy.relayerPrivateKey);
        this.networks.sepolia.eth.accounts.privateKeyToAccount(config.sepolia.relayerPrivateKey);

        this.pendingTransfers = {
            amoy: new Map(),
            sepolia: new Map()
        };

        // Initialize empty Merkle trees with default values
        this.merkleTrees = {
            amoy: new MerkleTree([], keccak256, { sortPairs: true }),
            sepolia: new MerkleTree([], keccak256, { sortPairs: true })
        };

        // Initialize default roots
        this.merkleRoots = {
            amoy: '0x' + '0'.repeat(64),
            sepolia: '0x' + '0'.repeat(64)
        };

        this.lastProcessedBlock = {
            amoy: 0,
            sepolia: 0
        };

        this.isRunning = false;

        this.transferStatus = new Map(); // Add this to track transfer status

        // Connect to MongoDB
        mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/bridge')
            .then(() => console.log('Connected to MongoDB'))
            .catch(err => console.error('MongoDB connection error:', err));
    }

    async start() {
        try {
            // Initialize storage
            await this.storage.init();

            // Load last processed blocks
            const blocks = await this.storage.loadLastProcessedBlocks();
            this.lastProcessedBlock = blocks;

            console.log('Starting bridge relayer with blocks:', this.lastProcessedBlock);
            this.isRunning = true;

            // Start monitoring both chains
            this.monitorChain('amoy');
            this.monitorChain('sepolia');

            // Start periodic tasks
            this.startPeriodicTasks();
        } catch (error) {
            console.error('Error starting relayer:', error);
            throw error;
        }
    }

    async stop() {
        this.isRunning = false;
    }

    // Modified to use polling instead of WebSocket
    async monitorChain(chainName) {
        try {
            const web3 = this.networks[chainName];
            const currentBlock = await web3.eth.getBlockNumber();
            const lastProcessed = this.lastProcessedBlock[chainName];

            // Convert BigInt to Number for block processing
            const fromBlock = Number(lastProcessed) + 1;
            const toBlock = Number(currentBlock);

            console.log(`Processing blocks on ${chainName} from ${fromBlock} to ${toBlock}`);

            if (fromBlock <= toBlock) {
                // Get events from bridge contract
                const events = await this.getEvents(this.contracts[chainName].bridge, fromBlock, toBlock);

                for (const event of events) {
                    await this.processEvent(chainName, event);
                }

                // Update last processed block
                this.lastProcessedBlock[chainName] = toBlock;
                await this.storage.saveLastProcessedBlock(this.lastProcessedBlock);
            }
        } catch (error) {
            console.error(`Error monitoring ${chainName}:`, error);
        }
    }

    async getEvents(contract, fromBlock, toBlock) {
        try {
            const events = await contract.getPastEvents('allEvents', {
                fromBlock,
                toBlock
            });
            return events;
        } catch (error) {
            console.error('Error getting events:', error);
            return [];
        }
    }

    async processEvent(chainName, event) {
        try {
            if (chainName === 'amoy') {
                if (event.event === 'TokensLocked') {
                    await this.handleTokenLock(event);
                } else if (event.event === 'TokensBurned') {
                    await this.handleTokenBurn(event);
                }
            } else { // sepolia
                if (event.event === 'TokensReleased') {
                    await this.handleTokenRelease(event);
                } else if (event.event === 'TokensUnlocked') {
                    await this.handleTokenUnlock(event);
                }
            }

            // Track the transfer status
            this.transferStatus.set(event.transactionHash, true);

        } catch (error) {
            console.error(`Error processing event on ${chainName}:`, error);
            this.transferStatus.set(event.transactionHash, false);
        }
    }

    async handleTokenLock(event) {
        const { user, amount, nonce } = event.returnValues;

        // Create transfer data
        const transferData = {
            user,
            amount,
            sourceChain: 'amoy',
            targetChain: 'sepolia',
            nonce,
            timestamp: Date.now()
        };

        // Generate transaction hash
        const txHash = this.generateTransactionHash(transferData);

        // Add to pending transfers
        this.pendingTransfers.amoy.set(txHash, transferData);

        // Update merkle tree
        await this.updateMerkleTree('sepolia', Array.from(this.pendingTransfers.amoy.values()));

        // Attempt to relay the transfer
        await this.relayTransfer('sepolia', transferData, txHash);
    }

    async handleTokenBurn(event) {
        const { user, amount, nonce } = event.returnValues;

        // Create transfer data
        const transferData = {
            user,
            amount,
            sourceChain: 'sepolia',
            targetChain: 'amoy',
            nonce,
            timestamp: Date.now()
        };

        // Generate transaction hash
        const txHash = this.generateTransactionHash(transferData);

        // Add to pending transfers
        this.pendingTransfers.sepolia.set(txHash, transferData);

        // Update merkle tree
        await this.updateMerkleTree('amoy', Array.from(this.pendingTransfers.sepolia.values()));

        // Attempt to relay the transfer
        await this.relayTransfer('amoy', transferData, txHash);
    }

    async relayTransfer(targetChain, transferData, transferId) {
        try {
            const contract = this.contracts[targetChain].bridge;
            const merkleTree = this.merkleTrees[targetChain];

            if (!merkleTree) {
                throw new Error('Merkle tree not initialized');
            }

            // Generate leaf
            const leaf = this.generateLeaf(
                transferData.user,
                transferData.amount.toString(),
                transferId
            );

            // Convert leaf to buffer for proof generation
            const leafBuffer = Buffer.from(leaf.slice(2), 'hex');
            
            // Get proof
            const proof = merkleTree.getHexProof(leafBuffer);

            console.log('Transfer verification details:', {
                targetChain,
                user: transferData.user,
                amount: transferData.amount.toString(),
                transferId,
                leaf,
                proof,
                merkleRoot: this.merkleRoots[targetChain],
                treeSize: merkleTree.getLeaves().length
            });

            // Verify proof locally
            const isValid = merkleTree.verify(
                proof,
                leafBuffer,
                merkleTree.getRoot()
            );

            if (!isValid) {
                throw new Error('Local Merkle proof verification failed');
            }

            const method = targetChain === 'sepolia' ? 'release' : 'unlock';
            const account = this.config[targetChain].relayerAccount;

            const receipt = await contract.methods[method](
                transferData.user,
                transferData.amount.toString(),
                proof,
                transferId
            ).send({
                from: account,
                gas: 500000
            });

            console.log(`Transfer completed on ${targetChain}:`, receipt.transactionHash);
            
            // Update transfer status
            this.transferStatus.set(transferId, true);

            return receipt;
        } catch (error) {
            console.error(`Error relaying transfer to ${targetChain}:`, error);
            this.transferStatus.set(transferId, false);
            throw error;
        }
    }

    async updateMerkleTree(chain, transfers) {
        try {
            console.log(`Updating Merkle tree for ${chain} with transfers:`, transfers);

            if (!transfers || transfers.length === 0) {
                console.log('No transfers to process');
                return this.merkleRoots[chain];
            }

            // Generate leaves
            const leaves = transfers.map(transfer => {
                const transferId = this.generateTransactionHash(transfer);
                const leaf = this.generateLeaf(
                    transfer.user,
                    transfer.amount.toString(),
                    transferId
                );
                console.log('Generated leaf for transfer:', {
                    user: transfer.user,
                    amount: transfer.amount.toString(),
                    transferId,
                    leaf
                });
                return Buffer.from(leaf.slice(2), 'hex');
            });

            // Create new Merkle tree
            this.merkleTrees[chain] = new MerkleTree(leaves, keccak256, {
                sortPairs: true,
                hashLeaves: false
            });

            const root = this.merkleTrees[chain].getHexRoot();
            console.log('New Merkle root:', root);
            console.log('Number of leaves in tree:', leaves.length);

            // Store root
            this.merkleRoots[chain] = root;

            // Update contract with new root
            const contract = this.contracts[chain].bridge;
            const account = this.config[chain].relayerAccount;

            const tx = await contract.methods.updateMerkleRoot(root)
                .send({ from: account, gas: 200000 });

            console.log('Merkle root updated on chain, tx:', tx.transactionHash);
            return tx;
        } catch (error) {
            console.error('Error updating Merkle tree:', error);
            throw error;
        }
    }

    // generateLeaf(transfer) {
    //     const encoded = ethers.solidityPacked(
    //         ['address', 'uint256', 'bytes32'],
    //         [
    //             transfer.user,
    //             transfer.amount.toString(),
    //             transfer.transferId || ethers.hexlify(ethers.randomBytes(32))
    //         ]
    //     );
    //     return ethers.keccak256(encoded);
    // }

    generateTransactionHash(transferData) {
        return Web3.utils.soliditySha3(
            { t: 'address', v: transferData.user },
            { t: 'uint256', v: transferData.amount.toString() },
            { t: 'uint256', v: transferData.nonce ? transferData.nonce.toString() : Date.now().toString() }
        );
    }

    generateLeaf(user, amount, transferId) {
        return Web3.utils.soliditySha3(
            { t: 'address', v: user },
            { t: 'uint256', v: amount },
            { t: 'bytes32', v: transferId }
        );
    }

    async startPeriodicTasks() {
        // Retry pending transfers periodically
        setInterval(async () => {
            await this.retryPendingTransfers();
        }, this.config.retryInterval || 5 * 60 * 1000); // Default: 5 minutes

        // Clean up old pending transfers
        setInterval(async () => {
            await this.cleanupOldTransfers();
        }, this.config.cleanupInterval || 60 * 60 * 1000); // Default: 1 hour
    }

    async retryPendingTransfers() {
        const now = Date.now();
        const retryThreshold = now - (this.config.retryThreshold || 5 * 60 * 1000); // 5 minutes

        // Retry Amoy to Sepolia transfers
        for (const [txHash, transfer] of this.pendingTransfers.amoy) {
            if (transfer.timestamp < retryThreshold) {
                await this.relayTransfer('sepolia', transfer, txHash);
            }
        }

        // Retry Sepolia to Amoy transfers
        for (const [txHash, transfer] of this.pendingTransfers.sepolia) {
            if (transfer.timestamp < retryThreshold) {
                await this.relayTransfer('amoy', transfer, txHash);
            }
        }
    }

    async cleanupOldTransfers() {
        const now = Date.now();
        const cleanupThreshold = now - (this.config.cleanupThreshold || 24 * 60 * 60 * 1000); // 24 hours

        // Cleanup old transfers and update merkle trees if needed
        let updatedAmoy = false;
        let updatedSepolia = false;

        // Cleanup Amoy transfers
        for (const [txHash, transfer] of this.pendingTransfers.amoy) {
            if (transfer.timestamp < cleanupThreshold) {
                this.pendingTransfers.amoy.delete(txHash);
                updatedAmoy = true;
            }
        }

        // Cleanup Sepolia transfers
        for (const [txHash, transfer] of this.pendingTransfers.sepolia) {
            if (transfer.timestamp < cleanupThreshold) {
                this.pendingTransfers.sepolia.delete(txHash);
                updatedSepolia = true;
            }
        }

        // Update merkle trees if needed
        if (updatedAmoy) {
            await this.updateMerkleTree(
                'sepolia',
                Array.from(this.pendingTransfers.amoy.values())
            );
        }
        if (updatedSepolia) {
            await this.updateMerkleTree(
                'amoy',
                Array.from(this.pendingTransfers.sepolia.values())
            );
        }
    }

    // Persistent storage methods (implement as needed)
    async loadLastProcessedBlocks() {
        // Implement loading from database/file
        await this.storage.loadLastProcessedBlocks();
    }

    async saveLastProcessedBlock(chain, blockNumber) {
        await this.storage.saveLastProcessedBlock(chain, blockNumber);
    }

    // Add method to track transfer status
    async getTransferStatus(txHash) {
        return this.transferStatus.get(txHash) || false;
    }

    // Add this helper method to the BridgeRelayer class
    convertBigIntToString(value) {
        return typeof value === 'bigint' ? value.toString() : value;
    }

    async queueTransfer(sourceChain, targetChain, transferData) {
        try {
            if (!['amoy', 'sepolia'].includes(sourceChain) || !['amoy', 'sepolia'].includes(targetChain)) {
                throw new Error('Invalid chain specified');
            }

            // Normalize transfer data
            const normalizedTransferData = {
                ...transferData,
                amount: this.convertBigIntToString(transferData.amount),
                sourceChain,
                targetChain,
                timestamp: Date.now()
            };

            // Generate transfer ID
            const transferId = this.generateTransactionHash(normalizedTransferData);

            // Add to pending transfers BEFORE trying to relay
            this.pendingTransfers[sourceChain].set(transferId, normalizedTransferData);

            // Update Merkle tree BEFORE trying to relay
            await this.updateMerkleTree(
                targetChain,
                Array.from(this.pendingTransfers[sourceChain].values())
            );

            // Now try to relay with updated Merkle tree
            await this.relayTransfer(targetChain, normalizedTransferData, transferId);

            return {
                success: true,
                transferId: transferId,
                status: 'queued',
                amount: normalizedTransferData.amount
            };
        } catch (error) {
            console.error('Error queuing transfer:', error);
            throw error;
        }
    }

    // Add this method to save transaction
    async saveTransaction(transferData, merkleRoot, merkleProof) {
        try {
            const transaction = new Transaction({
                transferId: transferData.transferId,
                sourceChain: transferData.sourceChain,
                targetChain: transferData.targetChain,
                userAddress: transferData.user,
                receiverAddress: transferData.receiver,
                amount: transferData.amount.toString(),
                merkleRoot,
                merkleProof,
                nonce: transferData.nonce,
                timestamp: transferData.timestamp
            });

            await transaction.save();
            return transaction;
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw error;
        }
    }

    // Add this method to save receipt
    async saveReceipt(transferId, receipt) {
        try {
            const transaction = await Transaction.findOne({ transferId });
            
            const txReceipt = new Receipt({
                transferId,
                transaction: transaction._id,
                sourceChainTxHash: receipt.sourceChainTxHash,
                targetChainTxHash: receipt.targetChainTxHash,
                gasUsed: receipt.gasUsed?.toString(),
                effectiveGasPrice: receipt.effectiveGasPrice?.toString()
            });

            await txReceipt.save();
            return txReceipt;
        } catch (error) {
            console.error('Error saving receipt:', error);
            throw error;
        }
    }
}

// Example configuration
const config = {
    amoy: {
        rpcUrl: 'http://localhost:8545', // Changed to HTTP
        bridgeAddress: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
        bridgeABI: AmoyBridgeABI,
        relayerAccount: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    sepolia: {
        rpcUrl: 'http://localhost:8546', // Changed to HTTP
        bridgeAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        bridgeABI: SepoliaBridgeABI,
        relayerAccount: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    retryInterval: 5 * 60 * 1000,
    cleanupInterval: 60 * 60 * 1000,
    retryThreshold: 5 * 60 * 1000,
    cleanupThreshold: 24 * 60 * 60 * 1000,
    mongoUri: 'mongodb://localhost:27017/bridge'
};


module.exports = BridgeRelayer;

// Usage
// const relayer = new BridgeRelayer(config);
// relayer.start().catch(console.error);