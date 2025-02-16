const { Web3 } = require('web3');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const RelayerStorage = require('./storage');
const AmoyBridgeABI = require('../Tester-2/artifacts/contracts/BridgeAmoy.sol/BridgeAmoy.json').abi;
const SepoliaBridgeABI = require('../Tester-2/artifacts/contracts/BridgeSepolia.sol/BridgeSepolia.json').abi;

class BridgeRelayer {
    constructor(config) {
        this.config = config;
        // Fix Web3 initialization
        this.networks = {
            amoy: new Web3(new Web3.providers.HttpProvider(config.amoy.rpcUrl)),
            sepolia: new Web3(new Web3.providers.HttpProvider(config.sepolia.rpcUrl))
        };
        this.storage = new RelayerStorage();
        // Initialize contracts
        this.contracts = {
            amoy: {
                bridge: new this.networks.amoy.eth.Contract(config.amoy.bridgeABI, config.amoy.bridgeAddress)
            },
            sepolia: {
                bridge: new this.networks.sepolia.eth.Contract(config.sepolia.bridgeABI, config.sepolia.bridgeAddress)
            }
        };

        // Add accounts to web3 instances
        this.networks.amoy.eth.accounts.privateKeyToAccount(config.amoy.relayerPrivateKey);
        this.networks.sepolia.eth.accounts.privateKeyToAccount(config.sepolia.relayerPrivateKey);

        this.pendingTransfers = {
            amoy: new Map(),
            sepolia: new Map()
        };

        this.merkleTrees = {
            amoy: null,
            sepolia: null
        };

        this.lastProcessedBlock = {
            amoy: 0,
            sepolia: 0
        };

        // Flag to control monitoring
        this.isRunning = false;
    }

    async start() {
        await this.storage.init();
        // Load last processed blocks from storage
        const blocks = await this.storage.loadLastProcessedBlocks();
        this.lastProcessedBlock = blocks;
        console.log('Starting bridge relayer...');
        this.isRunning = true;

        // Start monitoring both chains
        this.monitorChain('amoy');
        this.monitorChain('sepolia');

        // Start periodic tasks
        this.startPeriodicTasks();
    }

    async stop() {
        this.isRunning = false;
    }

    // Modified to use polling instead of WebSocket
    async monitorChain(chainName) {
        console.log(`Starting to monitor ${chainName} chain...`);

        while (this.isRunning) {
            try {
                const web3 = this.networks[chainName];
                const latestBlock = await web3.eth.getBlockNumber();

                if (latestBlock > this.lastProcessedBlock[chainName]) {
                    console.log(`Processing blocks on ${chainName} from ${this.lastProcessedBlock[chainName] + 1} to ${latestBlock}`);

                    await this.processBlocks(
                        chainName,
                        this.lastProcessedBlock[chainName] + 1,
                        latestBlock
                    );

                    this.lastProcessedBlock[chainName] = latestBlock;
                }

                // Wait for 1 second before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error monitoring ${chainName}:`, error);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async getEvents(contract, fromBlock, toBlock) {
        try {
            const events = await contract.getPastEvents('allEvents', {
                fromBlock,
                toBlock
            });
            return events;
        } catch (error) {
            console.error('Error getting events:', error);
            return [];
        }
    }

    async processBlocks(chainName, fromBlock, toBlock) {
        const contract = this.contracts[chainName].bridge;
        const events = await this.getEvents(contract, fromBlock, toBlock);

        for (const event of events) {
            await this.processEvent(chainName, event);
        }
    }

    async processEvent(chainName, event) {
        try {
            if (chainName === 'amoy') {
                if (event.event === 'TokensLocked') {
                    await this.handleTokenLock(event);
                } else if (event.event === 'TokensBurned') {
                    await this.handleTokenBurn(event);
                }
            } else { // sepolia
                if (event.event === 'TokensReleased') {
                    await this.handleTokenRelease(event);
                } else if (event.event === 'TokensUnlocked') {
                    await this.handleTokenUnlock(event);
                }
            }
        } catch (error) {
            console.error(`Error processing event on ${chainName}:`, error);
        }
    }

    async handleTokenLock(event) {
        const { user, amount, nonce } = event.returnValues;

        // Create transfer data
        const transferData = {
            user,
            amount,
            sourceChain: 'amoy',
            targetChain: 'sepolia',
            nonce,
            timestamp: Date.now()
        };

        // Generate transaction hash
        const txHash = this.generateTransactionHash(transferData);

        // Add to pending transfers
        this.pendingTransfers.amoy.set(txHash, transferData);

        // Update merkle tree
        await this.updateMerkleTree('sepolia', Array.from(this.pendingTransfers.amoy.values()));

        // Attempt to relay the transfer
        await this.relayTransfer('sepolia', transferData, txHash);
    }

    async handleTokenBurn(event) {
        const { user, amount, nonce } = event.returnValues;

        // Create transfer data
        const transferData = {
            user,
            amount,
            sourceChain: 'sepolia',
            targetChain: 'amoy',
            nonce,
            timestamp: Date.now()
        };

        // Generate transaction hash
        const txHash = this.generateTransactionHash(transferData);

        // Add to pending transfers
        this.pendingTransfers.sepolia.set(txHash, transferData);

        // Update merkle tree
        await this.updateMerkleTree('amoy', Array.from(this.pendingTransfers.sepolia.values()));

        // Attempt to relay the transfer
        await this.relayTransfer('amoy', transferData, txHash);
    }

    async relayTransfer(targetChain, transferData, txHash) {
        try {
            const contract = this.contracts[targetChain].bridge;
            const merkleTree = this.merkleTrees[targetChain];

            // Generate merkle proof
            const leaf = this.generateLeaf(transferData.user, transferData.amount, txHash);
            const proof = merkleTree.getHexProof(leaf);

            // Prepare transaction
            const method = targetChain === 'sepolia' ? 'release' : 'unlock';
            const account = this.config[targetChain].relayerAccount;

            // Send transaction
            const gas = await contract.methods[method](
                transferData.user,
                transferData.amount,
                proof,
                txHash
            ).estimateGas({ from: account });

            const receipt = await contract.methods[method](
                transferData.user,
                transferData.amount,
                proof,
                txHash
            ).send({
                from: account,
                gas: Math.floor(gas * 1.2) // Add 20% buffer
            });

            console.log(`Transfer relayed on ${targetChain}:`, receipt.transactionHash);

            // Remove from pending transfers after successful relay
            this.pendingTransfers[transferData.sourceChain].delete(txHash);

            // Update merkle tree
            await this.updateMerkleTree(
                targetChain,
                Array.from(this.pendingTransfers[transferData.sourceChain].values())
            );

        } catch (error) {
            console.error(`Error relaying transfer to ${targetChain}:`, error);
            // Keep transfer in pending for retry
        }
    }

    async updateMerkleTree(chain, transfers) {
        // Generate leaves from transfers
        const leaves = transfers.map(transfer =>
            this.generateLeaf(
                transfer.user,
                transfer.amount,
                this.generateTransactionHash(transfer)
            )
        );

        // Create new merkle tree
        this.merkleTrees[chain] = new MerkleTree(leaves, keccak256, {
            sortPairs: true,
            hashLeaves: false
        });

        // Update merkle root in contract
        const contract = this.contracts[chain].bridge;
        const account = this.config[chain].relayerAccount;

        try {
            await contract.methods.updateMerkleRoot(
                this.merkleTrees[chain].getHexRoot()
            ).send({ from: account });
        } catch (error) {
            console.error(`Error updating merkle root on ${chain}:`, error);
        }
    }

    generateTransactionHash(transferData) {
        return this.networks.amoy.utils.soliditySha3(
            { t: 'address', v: transferData.user },
            { t: 'uint256', v: transferData.amount },
            { t: 'uint256', v: transferData.nonce }
        );
    }

    generateLeaf(user, amount, txHash) {
        return this.networks.amoy.utils.soliditySha3(
            { t: 'address', v: user },
            { t: 'uint256', v: amount },
            { t: 'bytes32', v: txHash }
        );
    }

    async startPeriodicTasks() {
        // Retry pending transfers periodically
        setInterval(async () => {
            await this.retryPendingTransfers();
        }, this.config.retryInterval || 5 * 60 * 1000); // Default: 5 minutes

        // Clean up old pending transfers
        setInterval(async () => {
            await this.cleanupOldTransfers();
        }, this.config.cleanupInterval || 60 * 60 * 1000); // Default: 1 hour
    }

    async retryPendingTransfers() {
        const now = Date.now();
        const retryThreshold = now - (this.config.retryThreshold || 5 * 60 * 1000); // 5 minutes

        // Retry Amoy to Sepolia transfers
        for (const [txHash, transfer] of this.pendingTransfers.amoy) {
            if (transfer.timestamp < retryThreshold) {
                await this.relayTransfer('sepolia', transfer, txHash);
            }
        }

        // Retry Sepolia to Amoy transfers
        for (const [txHash, transfer] of this.pendingTransfers.sepolia) {
            if (transfer.timestamp < retryThreshold) {
                await this.relayTransfer('amoy', transfer, txHash);
            }
        }
    }

    async cleanupOldTransfers() {
        const now = Date.now();
        const cleanupThreshold = now - (this.config.cleanupThreshold || 24 * 60 * 60 * 1000); // 24 hours

        // Cleanup old transfers and update merkle trees if needed
        let updatedAmoy = false;
        let updatedSepolia = false;

        // Cleanup Amoy transfers
        for (const [txHash, transfer] of this.pendingTransfers.amoy) {
            if (transfer.timestamp < cleanupThreshold) {
                this.pendingTransfers.amoy.delete(txHash);
                updatedAmoy = true;
            }
        }

        // Cleanup Sepolia transfers
        for (const [txHash, transfer] of this.pendingTransfers.sepolia) {
            if (transfer.timestamp < cleanupThreshold) {
                this.pendingTransfers.sepolia.delete(txHash);
                updatedSepolia = true;
            }
        }

        // Update merkle trees if needed
        if (updatedAmoy) {
            await this.updateMerkleTree(
                'sepolia',
                Array.from(this.pendingTransfers.amoy.values())
            );
        }
        if (updatedSepolia) {
            await this.updateMerkleTree(
                'amoy',
                Array.from(this.pendingTransfers.sepolia.values())
            );
        }
    }

    // Persistent storage methods (implement as needed)
    async loadLastProcessedBlocks() {
        // Implement loading from database/file
        await this.storage.loadLastProcessedBlocks();
    }

    async saveLastProcessedBlock(chain, blockNumber) {
        await this.storage.saveLastProcessedBlock(chain, blockNumber);
    }
}

// Example configuration
const config = {
    amoy: {
        rpcUrl: 'http://localhost:8545', // Changed to HTTP
        bridgeAddress: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
        bridgeABI: AmoyBridgeABI,
        relayerAccount: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    sepolia: {
        rpcUrl: 'http://localhost:8546', // Changed to HTTP
        bridgeAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        bridgeABI: SepoliaBridgeABI,
        relayerAccount: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        relayerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    },
    retryInterval: 5 * 60 * 1000,
    cleanupInterval: 60 * 60 * 1000,
    retryThreshold: 5 * 60 * 1000,
    cleanupThreshold: 24 * 60 * 60 * 1000
};

// Usage
const relayer = new BridgeRelayer(config);
relayer.start().catch(console.error);