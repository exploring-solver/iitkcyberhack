import { useState } from "react";
import { ethers } from "ethers";

const TransactionForm = ({ forwarderAddress }) => {
    const [tokenAddress, setTokenAddress] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const sendTransaction = async () => {
        if (!window.ethereum) return alert("Install MetaMask!");

        if (!ethers.isAddress(tokenAddress)) {
            return setStatus("Invalid Token Address");
        }

        if (!ethers.isAddress(recipient)) {
            return setStatus("Invalid Recipient Address");
        }

        if (isNaN(amount) || Number(amount) <= 0) {
            return setStatus("Amount must be a positive number");
        }

        setLoading(true);
        setStatus("");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            // Fetch current nonce for the user
            const nonce = await provider.getTransactionCount(userAddress, "latest");

            // Generate message hash
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256"],
                [userAddress, recipient, amount]
            );

            // Sign the message
            const signature = await signer.signMessage(messageHash);

            // Create forwarder contract instance
            const forwarderContract = new ethers.Contract(
                forwarderAddress,
                ["function forwardERC20(address token, address to, uint256 amount, uint256 nonce, bytes signature) external"],
                signer
            );
            
            // Send transaction
            const tx = await forwarderContract.forwardERC20(tokenAddress, recipient, amount, nonce, signature);
            // await tx.wait(); // Wait for confirmation
            const receipt = await tx.wait();
            console.log("Transaction confirmed with receipt:", receipt);


            setStatus("Transaction sent successfully!");
        } catch (err) {
            console.error("Error:", err);
            setStatus("Failed to send transaction. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-100 rounded shadow">
            <h1 className="text-xl font-bold mb-4">Gasless Transaction Forwarder</h1>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendTransaction();
                }}
                className="space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium mb-1">Token Address</label>
                    <input
                        type="text"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="Enter ERC-20 token address"
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Recipient Address</label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="Enter recipient address"
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full p-2 border rounded"
                        min="0"
                    />
                </div>

                <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded text-white ${loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Send Transaction"}
                </button>
            </form>

            {status && (
                <div className={`mt-4 p-2 rounded text-sm ${status.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default TransactionForm;
