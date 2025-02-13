const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize relayer with config
const config = {
    amoy: {
        rpcUrl: process.env.AMOY_RPC_URL || 'http://localhost:8545',
        bridgeAddress: process.env.AMOY_BRIDGE_ADDRESS,
        bridgeABI: require('../artifacts/contracts/BridgeAmoy.sol/BridgeAmoy.json').abi,
        relayerAccount: process.env.RELAYER_ADDRESS,
        relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'http://localhost:8546',
        bridgeAddress: process.env.SEPOLIA_BRIDGE_ADDRESS,
        bridgeABI: require('../artifacts/contracts/BridgeSepolia.sol/BridgeSepolia.json').abi,
        relayerAccount: process.env.RELAYER_ADDRESS,
        relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY
    }
};

const relayer = new BridgeRelayer(config);
const storage = new RelayerStorage();

// Initialize relayer and storage
(async () => {
    await storage.init();
    await relayer.start();
})();

// API Endpoints
app.get('/api/status', async (req, res) => {
    try {
        const blocks = await storage.loadLastProcessedBlocks();
        res.json({
            status: 'active',
            lastProcessedBlocks: blocks
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/transfers/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const transfers = await storage.getTransfersByAddress(address);
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/relay', async (req, res) => {
    try {
        const { sourceChain, targetChain, txHash, user, amount } = req.body;
        
        // Verify the transaction exists and hasn't been processed
        const isProcessed = await storage.isTransactionProcessed(txHash);
        if (isProcessed) {
            return res.status(400).json({ error: 'Transaction already processed' });
        }

        // Queue the transfer for processing
        await relayer.queueTransfer({
            sourceChain,
            targetChain,
            txHash,
            user,
            amount
        });

        res.json({ status: 'queued', txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Relayer service running on port ${PORT}`);
}); 