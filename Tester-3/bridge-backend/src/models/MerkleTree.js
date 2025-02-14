const mongoose = require('mongoose');

const merkleTreeSchema = new mongoose.Schema({
    merkleRoot: {
        type: String,
        required: true
    },
    transactions: [{
        transactionId: {
            type: String,
            required: true
        },
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
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('MerkleTree', merkleTreeSchema);