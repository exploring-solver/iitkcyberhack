const { MongoClient } = require('mongodb');
const { promisify } = require('util');
const fs = require('fs');
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

class RelayerStorage {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.db = null;
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
        if (this.config.storage.type === 'mongodb') {
            await this.db.collection('transfers').updateOne(
                { txHash: transfer.txHash },
                { $set: transfer },
                { upsert: true }
            );
        } else {
            // File-based storage
            const transfers = await this.loadTransfers();
            transfers[transfer.txHash] = transfer;
            await writeFileAsync(
                this.config.storage.transfersFile,
                JSON.stringify(transfers, null, 2)
            );
        }
    }

    async loadTransfers() {
        if (this.config.storage.type === 'mongodb') {
            const transfers = await this.db.collection('transfers')
                .find({ status: 'pending' })
                .toArray();
            return transfers.reduce((acc, transfer) => {
                acc[transfer.txHash] = transfer;
                return acc;
            }, {});
        } else {
            try {
                const data = await readFileAsync(this.config.storage.transfersFile);
                return JSON.parse(data);
            } catch (error) {
                return {};
            }
        }
    }

    async updateTransferStatus(txHash, status, data = {}) {
        if (this.config.storage.type === 'mongodb') {
            await this.db.collection('transfers').updateOne(
                { txHash },
                { 
                    $set: { 
                        status,
                        ...data,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            const transfers = await this.loadTransfers();
            if (transfers[txHash]) {
                transfers[txHash] = {
                    ...transfers[txHash],
                    status,
                    ...data,
                    updatedAt: new Date()
                };
                await writeFileAsync(
                    this.config.storage.transfersFile,
                    JSON.stringify(transfers, null, 2)
                );
            }
        }
    }

    async saveLastProcessedBlock(chain, blockNumber) {
        if (this.config.storage.type === 'mongodb') {
            await this.db.collection('blocks').updateOne(
                { chain },
                { $set: { blockNumber } },
                { upsert: true }
            );
        } else {
            const blocks = await this.loadLastProcessedBlocks();
            blocks[chain] = blockNumber;
            await writeFileAsync(
                this.config.storage.blocksFile,
                JSON.stringify(blocks, null, 2)
            );
        }
    }

    async loadLastProcessedBlocks() {
        if (this.config.storage.type === 'mongodb') {
            const blocks = await this.db.collection('blocks').find().toArray();
            return blocks.reduce((acc, block) => {
                acc[block.chain] = block.blockNumber;
                return acc;
            }, {});
        } else {
            try {
                const data = await readFileAsync(this.config.storage.blocksFile);
                return JSON.parse(data);
            } catch (error) {
                return { amoy: 0, sepolia: 0 };
            }
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

// Extended BridgeRelayer class with persistence
class PersistentBridgeRelayer extends BridgeRelayer {
    constructor(config) {
        super(config);
        this.storage = new RelayerStorage(config);
    }

    async start() {
        await this.storage.connect();
        
        // Load last processed blocks
        const blocks = await this.storage.loadLastProcessedBlocks();
        this.lastProcessedBlock = blocks;
        
        // Load pending transfers
        const transfers = await this.storage.loadTransfers();
        for (const [txHash, transfer] of Object.entries(transfers)) {
            if (transfer.status === 'pending') {
                this.pendingTransfers[transfer.sourceChain].set(txHash, transfer);
            }
        }
        
        // Start monitoring
        await super.start();
    }

    async handleTokenLock(event) {
        const transfer = await super.handleTokenLock(event);
        await this.storage.saveTransfer({
            ...transfer,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return transfer;
    }

    async handleTokenBurn(event) {
        const transfer = await super.handleTokenBurn(event);
        await this.storage.saveTransfer({
            ...transfer,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return transfer;
    }

    async relayTransfer(targetChain, transferData, txHash) {
        try {
            await super.relayTransfer(targetChain, transferData, txHash);
            await this.storage.updateTransferStatus(txHash, 'completed', {
                completedAt: new Date()
            });
        } catch (error) {
            await this.storage.updateTransferStatus(txHash, 'failed', {
                error: error.message
            });
            throw error;
        }
    }

    async saveLastProcessedBlock(chain, blockNumber) {
        await this.storage.saveLastProcessedBlock(chain, blockNumber);
    }

    async stop() {
        await this.storage.close();
    }
}

// Example configuration with storage options
const config = {
    // ... previous config ...
    storage: {
        type: 'mongodb', // or 'file'
        url: 'mongodb://localhost:27017',
        database: 'bridge_relayer',
        // For file-based storage
        transfersFile: './data/transfers.json',
        blocksFile: './data/blocks.json'
    }
};