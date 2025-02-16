const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    sourceChain: {
        type: String,
        required: true
    },
    targetChain: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    merkleRoot: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;