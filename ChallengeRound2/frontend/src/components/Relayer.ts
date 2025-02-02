// relayer/index.ts
import { ethers } from 'ethers';
import { createLogger, format, transports } from 'winston';

// Configure logging
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'relayer-error.log', level: 'error' }),
    new transports.File({ filename: 'relayer.log' })
  ]
});

class CrossChainRelayer {
  private chainAProvider: ethers.JsonRpcProvider;
  private chainBProvider: ethers.JsonRpcProvider;
  private chainAWallet: ethers.Wallet;
  private chainBWallet: ethers.Wallet;
  private chainAGateway: ethers.Contract;
  private chainBGateway: ethers.Contract;
  private processedEvents: Set<string>;
  
  constructor(
    chainAUrl: string,
    chainBUrl: string,
    privateKey: string,
    chainAGatewayAddress: string,
    chainBGatewayAddress: string,
    chainAGatewayABI: any,
    chainBGatewayABI: any
  ) {
    this.chainAProvider = new ethers.JsonRpcProvider(chainAUrl);
    this.chainBProvider = new ethers.JsonRpcProvider(chainBUrl);
    
    this.chainAWallet = new ethers.Wallet(privateKey, this.chainAProvider);
    this.chainBWallet = new ethers.Wallet(privateKey, this.chainBProvider);
    
    this.chainAGateway = new ethers.Contract(
      chainAGatewayAddress,
      chainAGatewayABI,
      this.chainAWallet
    );
    
    this.chainBGateway = new ethers.Contract(
      chainBGatewayAddress,
      chainBGatewayABI,
      this.chainBWallet
    );
    
    this.processedEvents = new Set();
  }
  
  async start() {
    logger.info('Starting relayer service...');
    
    // Listen for Lock events on Chain A
    this.chainAGateway.on('Locked', async (token, from, amount, nonce, isERC721, tokenId, event) => {
      const eventId = `${event.blockHash}-${event.transactionHash}-${event.logIndex}`;
      
      if (this.processedEvents.has(eventId)) {
        return;
      }
      
      try {
        logger.info('Processing Lock event', {
          token,
          from,
          amount: amount.toString(),
          nonce: nonce.toString(),
          isERC721,
          tokenId: tokenId.toString()
        });
        
        // Create message hash
        const message = ethers.solidityPackedKeccak256(
          ['address', 'address', 'uint256', 'uint256', 'bool', 'uint256'],
          [token, from, amount, nonce, isERC721, tokenId]
        );
        
        // Sign message
        const signature = await this.chainAWallet.signMessage(ethers.getBytes(message));
        
        // Submit mint transaction on Chain B
        const tx = await this.chainBGateway.mint(
          token,
          from,
          amount,
          nonce,
          isERC721,
          tokenId,
          signature
        );
        
        await tx.wait();
        this.processedEvents.add(eventId);
        
        logger.info('Successfully processed Lock event', {
          transactionHash: tx.hash
        });
      } catch (error) {
        logger.error('Error processing Lock event', {
          error,
          eventId
        });
      }
    });
    
    // Listen for Burn events on Chain B
    this.chainBGateway.on('Burned', async (originalToken, from, amount, nonce, isERC721, tokenId, event) => {
      const eventId = `${event.blockHash}-${event.transactionHash}-${event.logIndex}`;
      
      if (this.processedEvents.has(eventId)) {
        return;
      }
      
      try {
        logger.info('Processing Burn event', {
          originalToken,
          from,
          amount: amount.toString(),
          nonce: nonce.toString(),
          isERC721,
          tokenId: tokenId.toString()
        });
        
        // Create message hash
        const message = ethers.solidityPackedKeccak256(
          ['address', 'address', 'uint256', 'uint256', 'bool', 'uint256'],
          [originalToken, from, amount, nonce, isERC721, tokenId]
        );
        
        // Sign message
        const signature = await this.chainBWallet.signMessage(ethers.getBytes(message));
        
        // Submit unlock transaction on Chain A
        const tx = await this.chainAGateway.unlock(
          originalToken,
          from,
          amount,
          nonce,
          isERC721,
          tokenId,
          signature
        );
        
        await tx.wait();
        this.processedEvents.add(eventId);
        
        logger.info('Successfully processed Burn event', {
          transactionHash: tx.hash
        });
      } catch (error) {
        logger.error('Error processing Burn event', {
          error,
          eventId
        });
      }
    });
    
    logger.info('Relayer service started');
  }
  
  async stop() {
    logger.info('Stopping relayer service...');
    this.chainAGateway.removeAllListeners();
    this.chainBGateway.removeAllListeners();
    logger.info('Relayer service stopped');
  }
}

export default CrossChainRelayer;