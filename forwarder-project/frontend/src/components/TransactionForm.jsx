


// import { useState } from "react";
// import { ethers } from "ethers";

// const TransactionForm = ({ forwarderAddress }) => {
//     const [tokenAddress, setTokenAddress] = useState("");
//     const [recipient, setRecipient] = useState("");
//     const [amount, setAmount] = useState("");
//     const [tokenId, setTokenId] = useState(""); // For ERC-721
//     const [status, setStatus] = useState("");
//     const [loading, setLoading] = useState(false);

//     const sendERC20Transaction = async () => {
//         if (!window.ethereum) return alert("Install MetaMask!");

//         if (!ethers.isAddress(tokenAddress)) {
//             return setStatus("Invalid Token Address");
//         }

//         if (!ethers.isAddress(recipient)) {
//             return setStatus("Invalid Recipient Address");
//         }

//         if (isNaN(amount) || Number(amount) <= 0) {
//             return setStatus("Amount must be a positive number");
//         }

//         setLoading(true);
//         setStatus("");

//         try {
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner();
//             const userAddress = await signer.getAddress();

//             const nonce = await provider.getTransactionCount(userAddress, "latest");

//             const messageHash = ethers.solidityPackedKeccak256(
//                 ["address", "address", "uint256"],
//                 [userAddress, recipient, amount]
//             );

//             const signature = await signer.signMessage(messageHash);

//             const forwarderContract = new ethers.Contract(
//                 forwarderAddress,
//                 [
//                     "function forwardERC20(address token, address to, uint256 amount, uint256 nonce, bytes signature) external"
//                 ],
//                 signer
//             );

//             const tx = await forwarderContract.forwardERC20(tokenAddress, recipient, amount, nonce, signature);
//             const receipt = await tx.wait();
//             console.log("Transaction confirmed with receipt:", receipt);

//             setStatus("ERC-20 transaction sent successfully!");
//         } catch (err) {
//             console.error("Error:", err);
//             setStatus("Failed to send ERC-20 transaction. Check console for details.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const sendERC721Transaction = async () => {
//         if (!window.ethereum) return alert("Install MetaMask!");

//         if (!ethers.isAddress(tokenAddress)) {
//             return setStatus("Invalid Token Address");
//         }

//         if (!ethers.isAddress(recipient)) {
//             return setStatus("Invalid Recipient Address");
//         }

//         if (!tokenId) {
//             return setStatus("Token ID cannot be empty");
//         }

//         setLoading(true);
//         setStatus("");

//         try {
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner();
//             const userAddress = await signer.getAddress();

//             const nonce = await provider.getTransactionCount(userAddress, "latest");

//             const messageHash = ethers.solidityPackedKeccak256(
//                 ["address", "address", "uint256"],
//                 [userAddress, recipient, tokenId]
//             );

//             const signature = await signer.signMessage(messageHash);

//             const forwarderContract = new ethers.Contract(
//                 forwarderAddress,
//                 [
//                     "function forwardERC721(address token, address to, uint256 tokenId, uint256 nonce, bytes signature) external"
//                 ],
//                 signer
//             );

//             const tx = await forwarderContract.forwardERC721(tokenAddress, recipient, tokenId, nonce, signature);
//             const receipt = await tx.wait();
//             console.log("Transaction confirmed with receipt:", receipt);

//             setStatus("ERC-721 transaction sent successfully!");
//         } catch (err) {
//             console.error("Error:", err);
//             setStatus("Failed to send ERC-721 transaction. Check console for details.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="p-6 bg-gray-100 rounded shadow">
//             <h1 className="text-xl font-bold mb-4">Gasless Transaction Forwarder</h1>
//             <form
//                 onSubmit={(e) => {
//                     e.preventDefault();
//                     sendERC20Transaction();
//                 }}
//                 className="space-y-4"
//             >
//                 <h2 className="text-lg font-semibold">ERC-20 Transfer</h2>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Token Address</label>
//                     <input
//                         type="text"
//                         value={tokenAddress}
//                         onChange={(e) => setTokenAddress(e.target.value)}
//                         placeholder="Enter ERC-20 token address"
//                         className="w-full p-2 border rounded"
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Recipient Address</label>
//                     <input
//                         type="text"
//                         value={recipient}
//                         onChange={(e) => setRecipient(e.target.value)}
//                         placeholder="Enter recipient address"
//                         className="w-full p-2 border rounded"
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Amount</label>
//                     <input
//                         type="number"
//                         value={amount}
//                         onChange={(e) => setAmount(e.target.value)}
//                         placeholder="Enter amount"
//                         className="w-full p-2 border rounded"
//                         min="0"
//                     />
//                 </div>
//                 <button
//                     type="submit"
//                     className={`w-full py-2 px-4 rounded text-white ${
//                         loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
//                     }`}
//                     disabled={loading}
//                 >
//                     {loading ? "Processing..." : "Send ERC-20 Transaction"}
//                 </button>
//             </form>

//             <form
//                 onSubmit={(e) => {
//                     e.preventDefault();
//                     sendERC721Transaction();
//                 }}
//                 className="space-y-4 mt-6"
//             >
//                 <h2 className="text-lg font-semibold">ERC-721 Transfer</h2>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Token Address</label>
//                     <input
//                         type="text"
//                         value={tokenAddress}
//                         onChange={(e) => setTokenAddress(e.target.value)}
//                         placeholder="Enter ERC-721 token address"
//                         className="w-full p-2 border rounded"
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Recipient Address</label>
//                     <input
//                         type="text"
//                         value={recipient}
//                         onChange={(e) => setRecipient(e.target.value)}
//                         placeholder="Enter recipient address"
//                         className="w-full p-2 border rounded"
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium mb-1">Token ID</label>
//                     <input
//                         type="text"
//                         value={tokenId}
//                         onChange={(e) => setTokenId(e.target.value)}
//                         placeholder="Enter token ID"
//                         className="w-full p-2 border rounded"
//                     />
//                 </div>
//                 <button
//                     type="submit"
//                     className={`w-full py-2 px-4 rounded text-white ${
//                         loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
//                     }`}
//                     disabled={loading}
//                 >
//                     {loading ? "Processing..." : "Send ERC-721 Transaction"}
//                 </button>
//             </form>

//             {status && (
//                 <div
//                     className={`mt-4 p-2 rounded text-sm ${
//                         status.includes("successfully")
//                             ? "bg-green-100 text-green-700"
//                             : "bg-red-100 text-red-700"
//                     }`}
//                 >
//                     {status}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default TransactionForm;











import { useState } from "react";
import { ethers } from "ethers";

const TransactionForm = ({ forwarderAddress }) => {
    const [tokenAddress, setTokenAddress] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [tokenId, setTokenId] = useState(""); // For ERC-721
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const relayerAbi = [
        "function relayERC20(address token, address to, uint256 amount, uint256 nonce, bytes signature) external",
        "function relayERC721(address token, address to, uint256 tokenId, uint256 nonce, bytes signature) external"
    ];
    

    const sendERC20Transaction = async () => {
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
    
            const nonce = await provider.getTransactionCount(userAddress, "latest");
    
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256"],
                [userAddress, recipient, amount]
            );
    
            const signature = await signer.signMessage(messageHash);
    
            const relayerContract = new ethers.Contract(
                forwarderAddress, // Use the deployed Relayer contract address here
                relayerAbi, // ABI of the Relayer contract
                signer
            );
    
            const tx = await relayerContract.relayERC20(tokenAddress, recipient, amount, nonce, signature);
            const receipt = await tx.wait();
            console.log("Transaction confirmed with receipt:", receipt);
    
            setStatus("ERC-20 transaction sent successfully!");
        } catch (err) {
            console.error("Error:", err);
            setStatus("Failed to send ERC-20 transaction. Check console for details.");
        } finally {
            setLoading(false);
        }
    };
    
    const sendERC721Transaction = async () => {
        if (!window.ethereum) return alert("Install MetaMask!");
    
        if (!ethers.isAddress(tokenAddress)) {
            return setStatus("Invalid Token Address");
        }
    
        if (!ethers.isAddress(recipient)) {
            return setStatus("Invalid Recipient Address");
        }
    
        if (!tokenId) {
            return setStatus("Token ID cannot be empty");
        }
    
        setLoading(true);
        setStatus("");
    
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
    
            const nonce = await provider.getTransactionCount(userAddress, "latest");
    
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "address", "uint256"],
                [userAddress, recipient, tokenId]
            );
    
            const signature = await signer.signMessage(messageHash);
    
            const relayerContract = new ethers.Contract(
                forwarderAddress, // Use the deployed Relayer contract address here
                relayerAbi, // ABI of the Relayer contract
                signer
            );
    
            const tx = await relayerContract.relayERC721(tokenAddress, recipient, tokenId, nonce, signature);
            const receipt = await tx.wait();
            console.log("Transaction confirmed with receipt:", receipt);
    
            setStatus("ERC-721 transaction sent successfully!");
        } catch (err) {
            console.error("Error:", err);
            setStatus("Failed to send ERC-721 transaction. Check console for details.");
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
                    sendERC20Transaction();
                }}
                className="space-y-4"
            >
                <h2 className="text-lg font-semibold">ERC-20 Transfer</h2>
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
                    className={`w-full py-2 px-4 rounded text-white ${
                        loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Send ERC-20 Transaction"}
                </button>
            </form>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendERC721Transaction();
                }}
                className="space-y-4 mt-6"
            >
                <h2 className="text-lg font-semibold">ERC-721 Transfer</h2>
                <div>
                    <label className="block text-sm font-medium mb-1">Token Address</label>
                    <input
                        type="text"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="Enter ERC-721 token address"
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
                    <label className="block text-sm font-medium mb-1">Token ID</label>
                    <input
                        type="text"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        placeholder="Enter token ID"
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded text-white ${
                        loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
                    }`}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Send ERC-721 Transaction"}
                </button>
            </form>

            {status && (
                <div
                    className={`mt-4 p-2 rounded text-sm ${
                        status.includes("successfully")
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {status}
                </div>
            )}
        </div>
    );
};

export default TransactionForm;
