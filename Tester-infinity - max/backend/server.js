// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const RelayerService = require('./services/relayerService');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Initialize relayer service with both ERC20 and ERC721 bridges
const relayerConfig = {
    amoyRpc: process.env.AMOY_RPC_URL,
    sepoliaRpc: process.env.SEPOLIA_RPC_URL,
    privateKey: process.env.RELAYER_PRIVATE_KEY,
    bridges: {
        amoy: {
            erc20: process.env.AMOY_ERC20_BRIDGE_ADDRESS,
            erc721: process.env.AMOY_NFT_BRIDGE_ADDRESS
        },
        sepolia: {
            erc20: process.env.SEPOLIA_ERC20_BRIDGE_ADDRESS,
            erc721: process.env.SEPOLIA_NFT_BRIDGE_ADDRESS
        }
    },
    relayers: [process.env.RELAYER_ADDRESS]
};

const relayerService = new RelayerService(relayerConfig);

// API Routes

// Get relayer status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        bridges: {
            amoy: {
                erc20: relayerConfig.bridges.amoy.erc20,
                erc721: relayerConfig.bridges.amoy.erc721
            },
            sepolia: {
                erc20: relayerConfig.bridges.sepolia.erc20,
                erc721: relayerConfig.bridges.sepolia.erc721
            }
        },
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

// Get transfer status with type parameter
app.get('/api/transfer/:requestId', async (req, res) => {
    try {
        const type = req.query.type || 'erc20'; // Default to ERC20
        
        const amoyStatus = await relayerService.getTransferStatus(
            req.params.requestId,
            'amoy',
            type
        );
        const sepoliaStatus = await relayerService.getTransferStatus(
            req.params.requestId,
            'sepolia',
            type
        );
        
        res.json({
            requestId: req.params.requestId,
            type,
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
    process.exit(0);
});

module.exports = app;