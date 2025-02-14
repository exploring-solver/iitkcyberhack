Sure, here's the proposed content for the /bridge-backend/src/app.js file:

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bridgeRoutes = require('./routes/bridgeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { connectToDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectToDatabase();

// Routes
app.use('/api/bridge', bridgeRoutes());
app.use('/api/transactions', transactionRoutes());

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
    console.log(`Server is running on port ${PORT}`);
});