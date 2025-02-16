const express = require('express');
const TransactionController = require('../controllers/transactionController');

const router = express.Router();
const transactionController = new TransactionController();

// Route to fetch transaction details by transaction ID
router.get('/transactions/:transactionId', transactionController.getTransactionDetails);

// Route to fetch all receipts
router.get('/receipts', transactionController.getAllReceipts);

// Route to fetch a specific receipt by transaction ID
router.get('/receipts/:transactionId', transactionController.getReceiptByTransactionId);

module.exports = router;