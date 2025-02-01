import React, { useState } from "react";
import Web3 from "web3";
import { ethers } from "ethers";

const TransactionForm = () => {
  const [form, setForm] = useState({
    tokenAddress: "",
    recipient: "",
    amount: "",
    tokenId: "",
  });

  const [messageHash, setMessageHash] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Connect to user's wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get user address
      const userAddress = await signer.getAddress();

      // Create the message hash to sign (e.g., for ERC20 transfers)
      const message = ethers.solidityPackedKeccak256(
        ["address", "address", "address", "uint256", "uint256"],
        [userAddress, form.tokenAddress, form.recipient, form.amount, 0] // 0 is the nonce for simplicity
      );
      
      // User signs the message off-chain
      const signature = await signer.signMessage(message);

      // Send signed message and transaction data to backend
      await fetch("http://localhost:3000/relay-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress,
          tokenAddress: form.tokenAddress,
          recipient: form.recipient,
          amount: form.amount,
          signature,
        }),
      });

      setMessageHash(message); // Set message hash for debugging or confirmation
      alert("Transaction request sent to relayer!");
    } catch (error) {
      console.error("Error signing and sending transaction:", error);
      alert("Error processing transaction");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="tokenAddress"
        placeholder="Token Address (ERC20)"
        value={form.tokenAddress}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="recipient"
        placeholder="Recipient Address"
        value={form.recipient}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
      />
      <button type="submit">Send Transaction</button>
      {messageHash && <p>Message Hash: {messageHash}</p>}
    </form>
  );
};

export default TransactionForm;
