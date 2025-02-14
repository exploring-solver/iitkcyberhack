const fs = require('fs').promises;
const path = require('path');
const BridgeRelayer = require('./BridgeRelayer');

class RelayerStorage {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.db = null;
        this.dataDir = config?.storage?.dataDir || path.join(__dirname, '..', 'data');
        this.blocksFile = path.join(this.dataDir, 'blocks.json');
        this.transfersFile = path.join(this.dataDir, 'transfers.json');
    }

    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await this.initializeFile(this.blocksFile, { amoy: 0, sepolia: 0 });
            await this.initializeFile(this.transfersFile, {});
            return true;
        } catch (error) {
            console.error('Error initializing storage:', error);
            throw error;
        }
    }

    async initializeFile(filePath, defaultContent) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
        }
    }

    async connect() {
        if (this.config.storage.type === 'mongodb') {
            this.client = await MongoClient.connect(this.config.storage.url);
            this.db = this.client.db(this.config.storage.database);
            await this.initializeCollections();
        }
    }

    async initializeCollections() {
        // Create collections if they don't exist
        await this.db.createCollection('transfers');
        await this.db.createCollection('blocks');
        
        // Create indexes
        await this.db.collection('transfers').createIndex({ txHash: 1 }, { unique: true });
        await this.db.collection('transfers').createIndex({ timestamp: 1 });
        await this.db.collection('transfers').createIndex({ status: 1 });
        await this.db.collection('blocks').createIndex({ chain: 1 }, { unique: true });
    }

    async saveTransfer(transfer) {
        try {
            const transfers = await this.loadTransfers();
            transfers[transfer.txHash] = {
                ...transfer,
                timestamp: Date.now()
            };
            await fs.writeFile(this.transfersFile, JSON.stringify(transfers, null, 2));
        } catch (error) {
            console.error('Error saving transfer:', error);
            throw error;
        }
    }

    async loadTransfers() {
        try {
            const data = await fs.readFile(this.transfersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading transfers:', error);
            return {};
        }
    }

    async updateTransferStatus(txHash, status, additionalData = {}) {
        try {
            const transfers = await this.loadTransfers();
            if (transfers[txHash]) {
                transfers[txHash] = {
                    ...transfers[txHash],
                    status,
                    ...additionalData,
                    updatedAt: Date.now()
                };
                await fs.writeFile(this.transfersFile, JSON.stringify(transfers, null, 2));
            }
        } catch (error) {
            console.error('Error updating transfer status:', error);
            throw error;
        }
    }

    async saveLastProcessedBlock(chain, blockNumber) {
        try {
            const blocks = await this.loadLastProcessedBlocks();
            blocks[chain] = blockNumber;
            await fs.writeFile(this.blocksFile, JSON.stringify(blocks, null, 2));
        } catch (error) {
            console.error('Error saving block:', error);
            throw error;
        }
    }

    async loadLastProcessedBlocks() {
        try {
            const data = await fs.readFile(this.blocksFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading blocks:', error);
            return { amoy: 0, sepolia: 0 };
        }
    }

    async getTransfersByAddress(address) {
        try {
            const transfers = await this.loadTransfers();
            return Object.values(transfers).filter(
                transfer => transfer.userAddress.toLowerCase() === address.toLowerCase()
            );
        } catch (error) {
            console.error('Error getting transfers by address:', error);
            return [];
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

module.exports = RelayerStorage; 
