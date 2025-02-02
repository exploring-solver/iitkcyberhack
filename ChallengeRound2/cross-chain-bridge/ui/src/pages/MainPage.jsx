import { useState, useContext, useEffect } from "react";
import { Web3Context } from "../contexts/Web3Context";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";

export default function Home() {
  const { web3, account, bridge, token, networkId, loading } = useContext(Web3Context);
  const [amount, setAmount] = useState("");
  const [logs, setLogs] = useState([]);
  const [isApproved, setIsApproved] = useState(false);
  const [processingTx, setProcessingTx] = useState(false);
  const [balance, setBalance] = useState("0");
  const [targetChain, setTargetChain] = useState("Sepolia"); // Default target chain

  // Chain configuration
  const CHAINS = {
    31337: { name: "Local Amoy", target: "Sepolia" },
    11155111: { name: "Sepolia", target: "Amoy" },
    80002: { name: "Amoy", target: "Sepolia" }
  };

  useEffect(() => {
    if (!token || !account) return;

    const loadBalance = async () => {
      try {
        const balance = await token.methods.balanceOf(account).call();
        console.log("Token Balance:", balance); // Debug log
        setBalance(web3.utils.fromWei(balance, "ether"));
      } catch (error) {
        console.error("Error fetching balance:", error);
        addLog("⚠️ Error fetching token balance", "warning");
      }
    };

    const checkAllowance = async () => {
      const allowance = await token.methods.allowance(account, bridge?._address).call();
      setIsApproved(allowance > 0);
    };

    loadBalance();
    checkAllowance();
  }, [token, account, bridge]);

  async function handleApprove() {
    if (!validateInput()) return;
    
    setProcessingTx(true);
    addLog("⏳ Approving token transfer...", "pending");
    
    try {
      const amountWei = web3.utils.toWei(amount, "ether");
      const tx = await token.methods
        .approve(bridge._address, amountWei)
        .send({ from: account });
      
      addLog(
        `✅ Approved ${amount} tokens for bridge`,
        "success",
        tx.transactionHash
      );
      setIsApproved(true);
    } catch (error) {
      addLog(`❌ Approval failed: ${error.message}`, "error");
    } finally {
      setProcessingTx(false);
    }
  }

  async function handleLock() {
    if (!validateInput()) return;
    
    setProcessingTx(true);
    addLog("⏳ Initiating cross-chain transfer...", "pending");
    
    try {
      const amountWei = web3.utils.toWei(amount, "ether");
      const tx = await bridge.methods
        .lock(amountWei, web3.utils.asciiToHex(targetChain))
        .send({ from: account });

      addLog(
        `🔒 Locked ${amount} tokens on ${CHAINS[networkId].name}`,
        "success",
        tx.transactionHash
      );

      // Simulate cross-chain minting (replace with actual relayer call)
      addLog(
        `⏳ Minting on ${targetChain}...`,
        "pending"
      );
      
      setTimeout(() => {
        addLog(
          `🪙 Minted ${amount} tokens on ${targetChain}`,
          "success"
        );
      }, 10000);

    } catch (error) {
      addLog(`❌ Transfer failed: ${error.message}`, "error");
    } finally {
      setProcessingTx(false);
    }
  }

  const validateInput = () => {
    if (!account) {
      addLog("⚠️ Connect wallet first", "warning");
      return false;
    }
    if (Number(amount) <= 0 || Number(amount) > Number(balance)) {
      addLog(`❌ Invalid amount (Balance: ${balance})`, "error");
      return false;
    }
    if (!bridge || !token) {
      addLog("⚠️ Bridge not initialized", "warning");
      return false;
    }
    return true;
  };

  const addLog = (message, status, txHash = null) => {
    setLogs(prev => [{
      id: Date.now(),
      message,
      status,
      txHash,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: <CheckCircle className="text-green-500 h-4 w-4" />,
      error: <XCircle className="text-red-500 h-4 w-4" />,
      pending: <Clock className="text-yellow-500 h-4 w-4" />,
      warning: <XCircle className="text-orange-500 h-4 w-4" />
    };
    return icons[status] || null;
  };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">
    <p className="text-xl animate-pulse">Initializing blockchain connection...</p>
  </div>;

  if (!account) return <div className="container mx-auto px-4 py-8 text-center min-h-screen">
    <p className="text-xl text-red-500">Wallet not connected</p>
  </div>;

async function mintTokens() {
  if (!token || !account) return;

  setProcessingTx(true);
  addLog("⏳ Minting test tokens...", "pending");

  try {
    const amountWei = web3.utils.toWei("1000", "ether"); // Mint 1000 tokens
    const tx = await token.methods
      .mint(account, amountWei)
      .send({ from: account });

    addLog(
      `✅ Minted 1000 test tokens`,
      "success",
      tx.transactionHash
    );

    // Refresh balance
    await loadBalance();
  } catch (error) {
    addLog(`❌ Minting failed: ${error.message}`, "error");
  } finally {
    setProcessingTx(false);
  }
}
  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={mintTokens}
        disabled={processingTx}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processingTx ? "Minting..." : "Mint Test Tokens"}
      </button>
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Cross-Chain Bridge
      </h1>

      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="mb-6">
          <div className="flex justify-between mb-4 text-gray-300">
            <span>From: {CHAINS[networkId]?.name}</span>
            <ArrowRight className="mx-2" />
            <select 
              value={targetChain}
              onChange={(e) => setTargetChain(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded"
            >
              {Object.values(CHAINS)
                .filter(c => c.name !== CHAINS[networkId]?.name)
                .map(c => (
                  <option key={c.target} value={c.target}>{c.target}</option>
                ))}
            </select>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <div className="flex justify-between text-gray-400 mb-2">
              <span>Balance: {balance}</span>
              <button 
                onClick={() => setAmount(balance)}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Max
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-2xl text-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4">
            {!isApproved ? (
              <button
                onClick={handleApprove}
                disabled={processingTx}
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingTx ? "Approving..." : "Approve Tokens"}
              </button>
            ) : (
              <button
                onClick={handleLock}
                disabled={processingTx}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingTx ? "Processing..." : `Bridge to ${targetChain}`}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Activity Log</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {logs.map(log => (
              <div 
                key={log.id}
                className="flex items-center p-3 bg-gray-900 rounded-lg"
              >
                <div className="mr-3">{getStatusIcon(log.status)}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{log.message}</p>
                  {log.txHash && (
                    <a 
                      href={`https://etherscan.io/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 text-xs hover:underline"
                    >
                      View transaction
                    </a>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}