const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');
const MerkleTree = require('../models/MerkleTree');

class TransactionService {
    async createTransaction(userAddress, amount, sourceChain, targetChain, transactionId) {
        const transaction = new Transaction({
            userAddress,
            amount,
            sourceChain,
            targetChain,
            transactionId,
            timestamp: new Date()
        });
        await transaction.save();
        return transaction;
    }

    async createReceipt(transactionId, status) {
        const receipt = new Receipt({
            transactionId,
            status,
            timestamp: new Date()
        });
        await receipt.save();
        return receipt;
    }

    async getTransactionById(transactionId) {
        return await Transaction.findOne({ transactionId });
    }

    async getAllTransactions() {
        return await Transaction.find({});
    }

    async getReceiptByTransactionId(transactionId) {
        return await Receipt.findOne({ transactionId });
    }

    async getAllReceipts() {
        return await Receipt.find({});
    }

    async createMerkleTree(root, transactions) {
        const merkleTree = new MerkleTree({
            root,
            transactions,
            timestamp: new Date()
        });
        await merkleTree.save();
        return merkleTree;
    }
}

module.exports = new TransactionService();