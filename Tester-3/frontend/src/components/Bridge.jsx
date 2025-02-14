import React, { useState, useEffect } from 'react';
import { useBridge } from '../contexts/BridgeContext';
import { useBridgeTransactions } from '../hooks/useBridgeTransactions';
import { useWeb3 } from '../contexts/Web3Context';
import { NETWORKS } from '../contexts/ContractContext';
import Web3 from 'web3';
import { relayerService } from '../services/relayerService';

const Bridge = () => {
    const { 
        account, 
        sourceChain, 
        targetChain, 
        isTransferring,
        setSourceChain,
        setTargetChain,
        handleBridgeTransfer,
        switchNetwork,
        contracts 
    } = useBridge();

    const { transactions, loading: txLoading } = useBridgeTransactions();
    const { provider } = useWeb3();

    // Form states
    const [amount, setAmount] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [transferType, setTransferType] = useState('token');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Balance states
    const [balance, setBalance] = useState('0');
    const [nftBalance, setNftBalance] = useState('0');
    const [ownedNFTs, setOwnedNFTs] = useState([]);
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    const fetchBalance = async () => {
        console.log('[fetchBalance] Starting balance fetch');
        
        if (!account || !contracts?.[sourceChain]?.token || isTransferring) {
            console.log('[fetchBalance] Exiting early due to missing prerequisites');
            return;
        }
    
        setIsBalanceLoading(true);
        try {
            const currentChainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            
            const expectedChainId = Web3.utils.toHex(NETWORKS[sourceChain].chainId);
            const actualChainId = currentChainId.toLowerCase();
    
            if (actualChainId !== expectedChainId.toLowerCase()) {
                try {
                    // Use a retry mechanism for network switching
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            await switchNetwork(sourceChain);
                            // Wait for network switch to settle
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            break;
                        } catch (switchError) {
                            retries--;
                            if (retries === 0) throw switchError;
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                } catch (switchError) {
                    console.error('[fetchBalance] Network switch failed:', switchError);
                    setBalance('0');
                    return;
                }
            }
    
            // Verify we're on the correct network after switching
            const finalChainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
    
            if (finalChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
                throw new Error('Network verification failed after switch');
            }
    
            const tokenContract = contracts[sourceChain].token;
            const balance = await tokenContract.methods.balanceOf(account).call();
            const formattedBalance = Web3.utils.fromWei(balance, 'ether');
            setBalance(formattedBalance);
    
        } catch (err) {
            console.error('[fetchBalance] Error:', err);
            setBalance('0');
        } finally {
            setIsBalanceLoading(false);
        }
    };

    const fetchOwnedNFTs = async () => {
        if (!account || !contracts?.[sourceChain]?.nft || isTransferring) return;

        setIsBalanceLoading(true);
        try {
            // Only switch networks if we're not in the middle of a transfer
            if (!isTransferring) {
                const currentChainId = await window.ethereum.request({ 
                    method: 'eth_chainId' 
                });
                
                const expectedChainId = NETWORKS[sourceChain].chainId.toUpperCase();
                const actualChainId = currentChainId.toUpperCase();
                
                if (actualChainId !== expectedChainId) {
                    try {
                        await switchNetwork(sourceChain);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (switchError) {
                        console.error('Network switch error in fetchOwnedNFTs:', switchError);
                        setNftBalance('0');
                        setOwnedNFTs([]);
                        return;
                    }
                }
            }

            const nftContract = contracts[sourceChain].nft;
            const balance = await nftContract.methods.balanceOf(account).call();
            setNftBalance(balance);

            const maxTokensToScan = 100;
            const ownedTokens = [];
            
            for (let i = 1; i <= maxTokensToScan; i++) {
                try {
                    const owner = await nftContract.methods.ownerOf(i).call();
                    if (owner.toLowerCase() === account.toLowerCase()) {
                        ownedTokens.push(i.toString());
                        if (ownedTokens.length >= parseInt(balance)) break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            setOwnedNFTs(ownedTokens);
        } catch (err) {
            console.error('Error fetching NFTs:', err);
            setNftBalance('0');
            setOwnedNFTs([]);
        } finally {
            setIsBalanceLoading(false);
        }
    };

    // Handle MetaMask network changes
    useEffect(() => {
        const handleChainChanged = async (chainId) => {
            const networkMap = {
                '0x7A69': 'amoy',    // 31337
                '0x7A6A': 'sepolia'  // 31338
            };
            // const networkMap = {
            //     '0x13882': 'amoy',
            //     '0xaa36a7': 'sepolia',
            // };

            const newNetwork = networkMap[chainId];
            if (newNetwork) {
                setSourceChain(newNetwork);
                setTargetChain(newNetwork === 'amoy' ? 'sepolia' : 'amoy');
                
                // Add delay before fetching new balances
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (transferType === 'token') {
                    await fetchBalance();
                } else {
                    await fetchOwnedNFTs();
                }
            }
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
            return () => {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [transferType]);

    // Fetch balances on component mount and when dependencies change
    useEffect(() => {
        const init = async () => {
            if (account && contracts?.[sourceChain] && !isTransferring) {
                await new Promise(resolve => setTimeout(resolve, 500));
                if (transferType === 'token') {
                    await fetchBalance();
                } else {
                    await fetchOwnedNFTs();
                }
            }
        };
        
        init();
    }, [account, sourceChain, contracts, transferType, isTransferring]);
    

    // Alert: Might be a breaking change comment below 14-02-2025, 00:53 am
    
    
    const handleTransfer = async () => {
        console.log('[handleTransfer] Starting transfer');
        if (!account) {
            console.log('[handleTransfer] No account connected');
            setError('Please connect your wallet');
            return;
        }
    
        try {
            setLoading(true);
            setError('');
            setSuccess('');
    
            console.log('[handleTransfer] Transfer parameters:', {
                transferType,
                amount,
                tokenId,
                receiverAddress: receiverAddress || account,
                sourceChain,
                targetChain
            });
    
            const amountInWei = Web3.utils.toWei(amount, 'ether').toString();
            console.log('[handleTransfer] Amount in Wei:', amountInWei);
    
            console.log('[handleTransfer] Initiating bridge transfer');
            const tx = await handleBridgeTransfer(
                transferType,
                amount,
                tokenId,
                receiverAddress || account
            );
    
            if (!tx?.transactionHash) {
                console.error('[handleTransfer] No transaction hash received');
                throw new Error('Failed to get transaction hash from bridge transfer');
            }
            console.log('[handleTransfer] Transaction hash:', tx.transactionHash);
    
            const transferData = {
                sourceChain,
                targetChain,
                userAddress: account,
                amount: amountInWei,
                transferId: tx.transactionHash,
                receiverAddress: receiverAddress || account
            };
    
            console.log('[handleTransfer] Submitting to relayer:', transferData);
            const result = await relayerService.requestBridgeTransfer(transferData);
    
            if (!result?.transferId) {
                console.error('[handleTransfer] No transfer ID received from relayer');
                throw new Error('Failed to get transfer ID from relayer');
            }
            console.log('[handleTransfer] Relayer transfer ID:', result.transferId);
    
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkStatus = async () => {
                console.log(`[handleTransfer] Checking status attempt ${attempts + 1}/${maxAttempts}`);
                try {
                    const status = await relayerService.getTransferStatus(result.transferId);
                    console.log('[handleTransfer] Transfer status:', status);
                    
                    if (status.completed) {
                        console.log('[handleTransfer] Transfer completed successfully');
                        setSuccess('Transfer completed successfully!');
                        setLoading(false);
                        if (transferType === 'token') {
                            await fetchBalance();
                        }
                        return;
                    } 
                    
                    if (status.error) {
                        console.error('[handleTransfer] Transfer status error:', status.error);
                        throw new Error(status.error);
                    }
    
                    attempts++;
                    if (attempts >= maxAttempts) {
                        console.error('[handleTransfer] Max attempts reached');
                        throw new Error('Transfer timeout - please check status later');
                    }
    
                    setTimeout(checkStatus, 10000);
                } catch (err) {
                    console.error('[handleTransfer] Status check error:', err);
                    setError(`Transfer failed: ${err.message}`);
                    setLoading(false);
                }
            };
    
            checkStatus();
    
        } catch (err) {
            console.error('[handleTransfer] Transfer error:', err);
            setError(err.message || 'An error occurred during transfer');
            setLoading(false);
        }
    };
    // const handleTransfer = async () => {
    //     if (!account) {
    //         setError('Please connect your wallet');
    //         return;
    //     }

    //     try {
    //         setLoading(true);
    //         setError('');
    //         setSuccess('');

    //         // First step: Lock or burn tokens
    //         const tx = await handleBridgeTransfer(
    //             transferType,
    //             amount,
    //             tokenId,
    //             receiverAddress
    //         );

    //         // Second step: Submit to relayer
    //         const transferData = {
    //             sourceChain,
    //             targetChain,
    //             userAddress: account,
    //             amount: Web3.utils.toWei(amount, 'ether'),
    //             transferId: tx.transactionHash,
    //             receiverAddress
    //         };

    //         const result = await relayerService.requestBridgeTransfer(transferData);

    //         // Start monitoring the transfer
    //         const checkStatus = async () => {
    //             const status = await relayerService.getTransferStatus(result.transferId);
    //             if (status.completed) {
    //                 setSuccess('Transfer completed successfully!');
    //                 setLoading(false);
    //                 // Refresh balances
    //                 if (transferType === 'token') {
    //                     await fetchBalance();
    //                 }
    //             } else if (!status.error) {
    //                 setTimeout(checkStatus, 5000); // Check again in 5 seconds
    //             } else {
    //                 setError('Transfer failed: ' + status.error);
    //                 setLoading(false);
    //             }
    //         };

    //         checkStatus();

    //     } catch (err) {
    //         console.error('Transfer error:', err);
    //         setError(err.message || 'An error occurred during transfer');
    //         setLoading(false);
    //     }
    // };

    // Modify fetchTransactions to use relayer service
    const fetchTransactions = async () => {
        if (!account) return;
        
        try {
            // const { transactions } = await relayerService.getTransactionHistory(account);
            // setTransactions(null);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    // Effect for fetching balances
    useEffect(() => {
        if (account && contracts?.[sourceChain]) {
            if (transferType === 'token') {
                fetchBalance();
            } else {
                fetchOwnedNFTs();
            }
        }
    }, [account, sourceChain, contracts, transferType]);

    // Effect for fetching transaction history
    useEffect(() => {
        if (account) {
            fetchTransactions();
        }
    }, [account, sourceChain, fetchTransactions]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Cross-Chain Bridge</h2>

                <div className="space-y-6">
                    {/* Transfer Type Selection */}
                    <div className="flex space-x-4">
                        <button
                            className={`px-4 py-2 rounded-md ${
                                transferType === 'token'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => setTransferType('token')}
                        >
                            Token Transfer
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md ${
                                transferType === 'nft'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => setTransferType('nft')}
                        >
                            NFT Transfer
                        </button>
                    </div>

                    {/* Balance Display */}
                    {transferType === 'token' ? (
                        <div className="text-gray-700">
                            Balance on {sourceChain}: {isBalanceLoading ? 'Loading...' : `${balance} tokens`}
                        </div>
                    ) : (
                        <div className="text-gray-700">
                            NFT Balance on {sourceChain}: {isBalanceLoading ? 'Loading...' : `${nftBalance} NFTs`}
                        </div>
                    )}

                    {/* Chain Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Source Chain</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={sourceChain}
                                onChange={(e) => {
                                    setSourceChain(e.target.value);
                                    setTargetChain(e.target.value === 'amoy' ? 'sepolia' : 'amoy');
                                }}
                            >
                                <option value="amoy">Amoy</option>
                                <option value="sepolia">Sepolia</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Target Chain</label>
                            <div className="mt-1 block w-full py-2">
                                {targetChain.charAt(0).toUpperCase() + targetChain.slice(1)}
                            </div>
                        </div>
                    </div>

                    {/* Transfer Form */}
                    <div className="space-y-4">
                        {transferType === 'token' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">NFT ID</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={tokenId}
                                    onChange={(e) => setTokenId(e.target.value)}
                                >
                                    <option value="">Select NFT</option>
                                    {ownedNFTs.map((id) => (
                                        <option key={id} value={id}>Token ID: {id}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Receiver Address</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={receiverAddress}
                                onChange={(e) => setReceiverAddress(e.target.value)}
                                placeholder="Enter receiver address"
                            />
                        </div>

                        <button
                            className={`w-full py-2 px-4 rounded-md ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white font-medium`}
                            onClick={handleTransfer}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Transfer'}
                        </button>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-100 text-green-700 rounded-md">
                            {success}
                        </div>
                    )}

                    {/* Transaction History Section */}
                    <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">Transaction History</h3>
                            <button
                                onClick={fetchTransactions}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-150 ease-in-out"
                                disabled={txLoading}
                            >
                                {txLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                        </svg>
                                        Refresh History
                                    </>
                                )}
                            </button>
                        </div>

                        {txLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div key={tx.hash} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-150">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        tx.type.includes('Lock') ? 'bg-yellow-100 text-yellow-800' :
                                                        tx.type.includes('Unlock') ? 'bg-green-100 text-green-800' :
                                                        tx.type.includes('Burn') ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {tx.type.includes('NFT') 
                                                            ? `Token ID: ${tx.amount}`
                                                            : `Amount: ${tx.amount} tokens`
                                                        }
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Block: {tx.blockNumber}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Tx: {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                                                </div>
                                            </div>
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-sm">No transactions found</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bridge;