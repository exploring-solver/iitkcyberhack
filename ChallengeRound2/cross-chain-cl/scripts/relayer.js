const { ethers } = require("ethers");
const chainAGatewayABI = require("../artifacts/contracts/Gateway.sol/ChainAGateway.json").abi;
const chainBGatewayABI = require("../artifacts/contracts/Gateway.sol/ChainBGateway.json").abi;

class Relayer {
  constructor(chainAProvider, chainBProvider, chainAGatewayAddress, chainBGatewayAddress, privateKey) {
    this.chainAProvider = chainAProvider;
    this.chainBProvider = chainBProvider;
    this.chainAGateway = new ethers.Contract(chainAGatewayAddress, chainAGatewayABI, chainAProvider);
    this.chainBGateway = new ethers.Contract(chainBGatewayAddress, chainBGatewayABI, chainBProvider);
    this.wallet = new ethers.Wallet(privateKey);
    this.chainAWallet = this.wallet.connect(chainAProvider);
    this.chainBWallet = this.wallet.connect(chainBProvider);
  }

  async start() {
    console.log("Starting relayer...");
    
    // Listen for Lock events on Chain A
    this.chainAGateway.on("Locked", async (token, from, amount, nonce, isERC721, tokenId) => {
      console.log("Lock event detected on Chain A");
      try {
        const message = ethers.solidityPackedKeccak256(
          ["address", "address", "uint256", "uint256", "bool", "uint256"],
          [token, from, amount, nonce, isERC721, tokenId]
        );
        const signature = await this.chainAWallet.signMessage(ethers.getBytes(message));
        
        await this.chainBGateway.connect(this.chainBWallet).mint(
          token, from, amount, nonce, isERC721, tokenId, signature
        );
        
        console.log("Minted tokens on Chain B");
      } catch (error) {
        console.error("Error processing lock event:", error);
      }
    });

    // Listen for Burn events on Chain B
    this.chainBGateway.on("Burned", async (originalToken, from, amount, nonce, isERC721, tokenId) => {
      console.log("Burn event detected on Chain B");
      try {
        const message = ethers.solidityPackedKeccak256(
          ["address", "address", "uint256", "uint256", "bool", "uint256"],
          [originalToken, from, amount, nonce, isERC721, tokenId]
        );
        const signature = await this.chainBWallet.signMessage(ethers.getBytes(message));
        
        await this.chainAGateway.connect(this.chainAWallet).unlock(
          originalToken, from, amount, nonce, isERC721, tokenId, signature
        );
        
        console.log("Unlocked tokens on Chain A");
      } catch (error) {
        console.error("Error processing burn event:", error);
      }
    });
  }
}

// Usage example:
const relayer = new Relayer(
  new ethers.JsonRpcProvider("CHAIN_A_RPC_URL"),
  new ethers.JsonRpcProvider("CHAIN_B_RPC_URL"),
  "CHAIN_A_GATEWAY_ADDRESS",
  "CHAIN_B_GATEWAY_ADDRESS",
  "RELAYER_PRIVATE_KEY"
);

relayer.start().catch(console.error); 