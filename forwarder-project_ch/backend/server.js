const express = require("express");
const { ethers } = require("ethers");
const RelayerABI = require("./RelayerABI.json"); // Import ABI of Relayer.sol
var cors = require('cors')

const app = express();
app.use(express.json());
app.use(cors());

const RELAYER_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Relayer's private key to pay for gas
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const relayerContract = new ethers.Contract(RELAYER_CONTRACT_ADDRESS, RelayerABI, wallet);

app.post("/relay-transaction", async (req, res) => {
  try {
    const { userAddress, tokenAddress, recipient, amount, signature } = req.body;

    // Create message hash (same as frontend)
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "address", "uint256", "uint256"],
      [userAddress, tokenAddress, recipient, amount, 0] // nonce set to 0
    );

    // Relay the transaction to the Relayer.sol contract (this pays for gas)
    const tx = await relayerContract.relayERC20(
      userAddress,
      tokenAddress,
      recipient,
      ethers.parseUnits(amount, 18), // Adjust decimals for token precision
      0, // nonce
      signature
    );

    console.log("Transaction relayed:", tx.hash);
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Error relaying transaction:", error);
    res.status(500).json({ error: "Failed to relay transaction" });
  }
});

app.listen(3000, () => {
  console.log("Relayer server is running on port 3000");
});
