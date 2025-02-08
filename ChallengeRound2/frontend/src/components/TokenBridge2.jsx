import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../context/Web3Context2';
import { ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";

function TokenBridge() {
  const {
    web3,
    account,
    chainId,
    networkName,
    contracts,
    loading: web3Loading,
    error: web3Error,
    connectWallet,
    switchNetwork
  } = useContext(Web3Context);

  console.log("Web3 Context:", { web3, account, chainId, networkName, contracts, web3Loading, web3Error });

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  const [isApproved, setIsApproved] = useState(false);
  const [logs, setLogs] = useState([]);
  const [targetChain, setTargetChain] = useState('');

  useEffect(() => {
    console.log("Effect: Network changed to", networkName);
    if (networkName === 'Amoy') {
      setTargetChain('SEPOLIA');
    } else if (networkName === 'Sepolia') {
      setTargetChain('AMOY');
    }
  }, [networkName]);

  useEffect(() => {
    console.log("Effect: Account, Contracts, or ChainId changed", { account, contracts, chainId });
    loadBalance();
    checkAllowance();
  }, [account, contracts, chainId]);

  const loadBalance = async () => {
    console.log("Function: loadBalance called");
    if (!contracts.token || !account) {
      console.warn("Token contract or account is missing!");
      return;
    }
    try {
      const balance = await contracts.token._methods.balanceOf(account).call();
      const formattedBalance = web3.utils.fromWei(balance, 'ether');
      console.log("Balance Loaded:", formattedBalance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
      addLog('Error loading balance', 'error');
    }
  };

  const checkAllowance = async () => {
    console.log("Function: checkAllowance called");
    if (!contracts.token || !contracts.bridge || !account) {
      console.warn("Token or Bridge contract is missing!");
      return;
    }
    try {
      const allowance = await contracts.token._methods.allowance(account, contracts.bridge._address).call();
      const isAllowed = parseInt(allowance) > 0;
      console.log("Allowance checked:", allowance, "Approved:", isAllowed);
      setIsApproved(isAllowed);
    } catch (error) {
      console.error('Error checking allowance:', error);
    }
  };

  const addLog = (message, status, txHash = null) => {
    console.log(`Adding log: ${message} [${status}]`);
    setLogs(prev => [{
      id: Date.now(),
      message,
      status,
      txHash,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const handleApprove = async () => {
    console.log("Function: handleApprove called");
    if (!validateInput()) return;

    setLoading(true);
    addLog('Approving token transfer...', 'pending');

    try {
      const amountWei = web3.utils.toWei(amount, 'ether');
      console.log("Approving tokens:", amountWei, "for", contracts.bridge._address);
      
      const tx = await contracts.token.methods
        .approve(contracts.bridge._address, amountWei)
        .send({ from: account });

      console.log("Approval Transaction:", tx);
      addLog('Tokens approved for bridge', 'success', tx.transactionHash);
      setIsApproved(true);
    } catch (error) {
      console.error('Approval error:', error);
      addLog(`Approval failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      console.log("Function: handleApprove finished");
    }
  };

  const handleBridge = async () => {
    console.log("Function: handleBridge called");
    if (!validateInput()) return;

    setLoading(true);
    addLog('Initiating bridge transfer...', 'pending');

    try {
      const amountWei = web3.utils.toWei(amount, 'ether');
      console.log("Bridging tokens:", amountWei, "from", networkName);

      const tx = await contracts.bridge.methods
        .lock(amountWei)
        .send({ from: account });

      console.log("Bridge Transaction:", tx);
      addLog(`Tokens locked on ${networkName}`, 'success', tx.transactionHash);
      loadBalance();
    } catch (error) {
      console.error('Bridge error:', error);
      addLog(`Bridge failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      console.log("Function: handleBridge finished");
    }
  };

  const validateInput = () => {
    console.log("Function: validateInput called with amount:", amount);
    if (!account) {
      console.warn("No wallet connected!");
      addLog('Please connect wallet first', 'error');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      console.warn("Invalid amount entered!");
      addLog('Please enter a valid amount', 'error');
      return false;
    }
    if (parseFloat(amount) > parseFloat(balance)) {
      console.warn("Insufficient balance!");
      addLog('Insufficient balance', 'error');
      return false;
    }
    console.log("Input validated successfully.");
    return true;
  };

  const getStatusIcon = (status) => {
    console.log("Rendering status icon for:", status);
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500 h-4 w-4" />;
      case 'error': return <XCircle className="text-red-500 h-4 w-4" />;
      case 'pending': return <Clock className="text-yellow-500 h-4 w-4 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Cross-Chain Token Bridge</h1>

        {!account ? (
          <div className="text-center">
            <button onClick={() => connectWallet()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-2">
              <p className="text-gray-300">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
              <p className="text-gray-300">Network: {networkName}</p>
              <p className="text-gray-300">Balance: {balance} Tokens</p>
            </div>

            <div className="mb-6">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
            </div>

            <div className="space-y-4">
              {!isApproved ? (
                <button onClick={handleApprove} disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg">
                  {loading ? 'Approving...' : 'Approve Tokens'}
                </button>
              ) : (
                <button onClick={handleBridge} disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg">
                  {loading ? 'Processing...' : 'Bridge Tokens'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TokenBridge;
