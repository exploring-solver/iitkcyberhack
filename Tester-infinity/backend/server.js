// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const RelayerService = require('./services/relayerService');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS handling
app.use(express.json()); // JSON parsing
app.use(morgan('combined')); // Logging

// Initialize relayer service
const relayerConfig = {
    amoyRpc: process.env.AMOY_RPC_URL,
    sepoliaRpc: process.env.SEPOLIA_RPC_URL,
    privateKey: process.env.RELAYER_PRIVATE_KEY,
    bridges: {
        amoy: process.env.AMOY_BRIDGE_ADDRESS,
        sepolia: process.env.SEPOLIA_BRIDGE_ADDRESS
    },
    relayers: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]
};

const relayerService = new RelayerService(relayerConfig);

// API Routes

// Get relayer status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        amoyBridge: relayerConfig.bridges.amoy,
        sepoliaBridge: relayerConfig.bridges.sepolia,
        relayerAddress: relayerService.relayerWallet.address
    });
});

// Get merkle proof for a relayer address
app.get('/api/proof/:address', (req, res) => {
    try {
        const proof = relayerService.getMerkleProof(req.params.address);
        res.json({ proof });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get transfer status
app.get('/api/transfer/:requestId', async (req, res) => {
    try {
        const amoyStatus = await relayerService.getTransferStatus(
            req.params.requestId,
            'amoy'
        );
        const sepoliaStatus = await relayerService.getTransferStatus(
            req.params.requestId,
            'sepolia'
        );
        
        res.json({
            requestId: req.params.requestId,
            amoyStatus,
            sepoliaStatus
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server and relayer service
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    relayerService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    // Add cleanup logic here if needed
    process.exit(0);
});

module.exports = app;