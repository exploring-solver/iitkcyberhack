const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transferId: { type: String, required: true, unique: true },
    sourceChain: { type: String, required: true },
    targetChain: { type: String, required: true },
    userAddress: { type: String, required: true },
    receiverAddress: { type: String, required: true },
    amount: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    merkleRoot: { type: String },
    merkleProof: [String],
    timestamp: { type: Date, default: Date.now },
    nonce: { type: String },
    txHash: { type: String },
    error: { type: String }
});

module.exports = mongoose.model('Transaction', transactionSchema);