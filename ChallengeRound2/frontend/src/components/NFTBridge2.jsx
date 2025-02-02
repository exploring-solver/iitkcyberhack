import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../context/Web3Context2';
import { ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  BridgeAmoyNFT,
  BridgeSepoliaNFT,
  NativeNFT,
  WrappedNFT,
} from '../contracts/contractAddresses';
import BridgeAmoyNFTABI from '../contracts/abis/BridgeAmoyNFT.json';
import BridgeSepoliaNFTABI from '../contracts/abis/BridgeSepoliaNFT.json';
import NativeNFTABI from '../contracts/abis/NativeNFT.json';
import WrappedNFTABI from '../contracts/abis/WrappedNFT.json';

function NFTBridge() {
  const {
    account,
    chainId,
    networkName,
    contracts,
    loading: web3Loading,
    error: web3Error,
    connectWallet,
    switchNetwork
  } = useContext(Web3Context);

  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [targetChain, setTargetChain] = useState('');

  useEffect(() => {
    if (networkName === 'Amoy') {
      setTargetChain('SEPOLIA');
    } else if (networkName === 'Sepolia') {
      setTargetChain('AMOY');
    }
  }, [networkName]);

  const addLog = (message, status, txHash = null) => {
    setLogs(prev => [{
      id: Date.now(),
      message,
      status,
      txHash,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const handleBridge = async () => {
    if (!tokenId) {
      addLog('Please enter a token ID', 'error');
      return;
    }

    setLoading(true);
    try {
      if (networkName === 'Amoy') {
        // Lock NFT on Amoy
        const approveTx = await contracts.nft.approve(contracts.bridgeNFT.address, tokenId);
        await approveTx.wait();
        addLog('NFT approved for bridge', 'success', approveTx.hash);

        const lockTx = await contracts.bridgeNFT.lock(tokenId);
        await lockTx.wait();
        addLog('NFT locked on Amoy', 'success', lockTx.hash);
      } else {
        // Burn wrapped NFT on Sepolia
        const burnTx = await contracts.bridgeNFT.burn(tokenId);
        await burnTx.wait();
        addLog('Wrapped NFT burned on Sepolia', 'success', burnTx.hash);
      }
    } catch (error) {
      console.error('Bridge error:', error);
      addLog(`Bridge failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cross-Chain NFT Bridge</h1>
      
      {/* Similar UI structure as TokenBridge with NFT-specific inputs */}
    </div>
  );
}

export default NFTBridge;