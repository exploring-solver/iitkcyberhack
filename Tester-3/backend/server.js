const express = require('express');
const cors = require('cors');
const { config } = require('./config');  // Destructure config from the import
const bridgeRoutes = require('./routes/bridgeRoutes');
const BridgeRelayer = require('./services/BridgeRelayer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize relayer with correct config structure
const relayer = new BridgeRelayer({ config });

// Start relayer
relayer.start().catch(console.error);

// Routes
app.use('/api/bridge', bridgeRoutes(relayer));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Bridge relayer service running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await relayer.stop();
    process.exit(0);
}); 