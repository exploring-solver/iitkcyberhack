// filepath: /bridge-backend/src/services/RelayerStorage.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const MerkleTree = require('../models/MerkleTree');
const Receipt = require('../models/Receipt');

class RelayerStorage {
    constructor(config) {
        this.config = config;
        this.db = null;
    }

    async init() {
        this.db = await mongoose.connect(this.config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }

    async saveTransaction(transactionData) {
        const transaction = new Transaction(transactionData);
        await transaction.save();
    }

    async saveMerkleTree(merkleData) {
        const merkleTree = new MerkleTree(merkleData);
        await merkleTree.save();
    }

    async saveReceipt(receiptData) {
        const receipt = new Receipt(receiptData);
        await receipt.save();
    }

    async loadTransactions() {
        return await Transaction.find({});
    }

    async loadMerkleTrees() {
        return await MerkleTree.find({});
    }

    async loadReceipts() {
        return await Receipt.find({});
    }

    async loadLastProcessedBlocks() {
        // Implement loading last processed blocks logic
    }

    async saveLastProcessedBlock(chain, blockNumber) {
        // Implement saving last processed block logic
    }
}

module.exports = RelayerStorage;