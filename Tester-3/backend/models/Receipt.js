const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    transferId: { type: String, required: true, unique: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    sourceChainTxHash: { type: String },
    targetChainTxHash: { type: String },
    gasUsed: { type: String },
    effectiveGasPrice: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Receipt', receiptSchema);