const express = require('express');
const bridgeController = require('../controllers/bridgeController');
const transactionController = require('../controllers/transactionController');

function bridgeRoutes() {
    const router = express.Router();

    // Route for processing transfers
    router.post('/transfer', bridgeController.processTransfer);

    // Route for getting transaction receipts
    router.get('/receipts/:transactionId', transactionController.getReceipt);

    // Route for getting transaction details
    router.get('/transactions/:userAddress', transactionController.getTransactions);

    return router;
}

module.exports = bridgeRoutes;