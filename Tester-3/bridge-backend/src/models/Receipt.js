const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    merkleRoot: {
        type: String,
        required: true
    },
    details: {
        type: Object,
        required: true
    }
});

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;