const express = require('express');

// Helper function to convert BigInt values to strings in an object
function convertBigIntToString(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}

function bridgeRoutes(relayer) {
    const router = express.Router();

    router.post('/transfer', async (req, res, next) => {
        try {
            const { sourceChain, targetChain, userAddress, amount, transferId, receiverAddress } = req.body;

            if (!sourceChain || !targetChain || !userAddress || !amount || !receiverAddress) {
                return res.status(400).json({
                    error: 'Missing required parameters'
                });
            }

            // Convert amount to string if it's a BigInt
            const transferData = {
                user: userAddress,
                amount: typeof amount === 'bigint' ? amount.toString() : amount,
                nonce: Date.now().toString(),
                timestamp: Date.now(),
                receiver: receiverAddress
            };

            const result = await relayer.queueTransfer(sourceChain, targetChain, transferData);

            // Convert any BigInt values in the result to strings
            const sanitizedResult = convertBigIntToString(result);

            res.json(sanitizedResult);
        } catch (error) {
            console.error('Bridge transfer error:', error);
            next(error);
        }
    });

    router.get('/status/:transferId', async (req, res, next) => {
        try {
            const status = await relayer.getTransferStatus(req.params.transferId);
            res.json({ status: status.toString() }); // Convert status to string if it's a BigInt
        } catch (error) {
            next(error);
        }
    });

    router.get('/transactions/:address', async (req, res) => {
        try {
            const { address } = req.params;
            const transactions = await relayer.getTransactionsByAddress(address);
            res.json({ transactions });
        } catch (error) {
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message 
            });
        }
    });

    return router;
}

module.exports = bridgeRoutes;