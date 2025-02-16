const fs = require('fs').promises;
const path = require('path');

class RelayerStorage {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.blocksFile = path.join(this.dataDir, 'blocks.json');
        this.transfersFile = path.join(this.dataDir, 'transfers.json');
    }

    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize blocks file if it doesn't exist
            try {
                await fs.access(this.blocksFile);
            } catch {
                await fs.writeFile(this.blocksFile, JSON.stringify({
                    amoy: 0,
                    sepolia: 0
                }));
            }
            
            // Initialize transfers file if it doesn't exist
            try {
                await fs.access(this.transfersFile);
            } catch {
                await fs.writeFile(this.transfersFile, JSON.stringify({}));
            }
        } catch (error) {
            console.error('Error initializing storage:', error);
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

    async saveLastProcessedBlock(chain, blockNumber) {
        try {
            const blocks = await this.loadLastProcessedBlocks();
            blocks[chain] = blockNumber;
            await fs.writeFile(this.blocksFile, JSON.stringify(blocks, null, 2));
        } catch (error) {
            console.error('Error saving block:', error);
        }
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
}

module.exports = RelayerStorage;
