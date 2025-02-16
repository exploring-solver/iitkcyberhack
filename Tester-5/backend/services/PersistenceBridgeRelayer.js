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