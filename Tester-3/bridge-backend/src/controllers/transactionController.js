const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');
const TransactionService = require('../services/TransactionService');

class TransactionController {
    async getTransactionDetails(req, res) {
        const { transactionId } = req.params;

        try {
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json(transaction);
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getReceipt(req, res) {
        const { transactionId } = req.params;

        try {
            const receipt = await Receipt.findOne({ transactionId });
            if (!receipt) {
                return res.status(404).json({ error: 'Receipt not found' });
            }
            res.json(receipt);
        } catch (error) {
            console.error('Error fetching receipt:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createReceipt(req, res) {
        const { transactionId, status } = req.body;

        try {
            const newReceipt = new Receipt({ transactionId, status, timestamp: new Date() });
            await newReceipt.save();
            res.status(201).json(newReceipt);
        } catch (error) {
            console.error('Error creating receipt:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new TransactionController();