import { useState, useEffect } from 'react';
import { useBridge } from '../contexts/BridgeContext';
import { useBridgeTransactions } from '../hooks/useBridgeTransactions';
import { NETWORKS } from '../contexts/ContractContext';
import Web3 from 'web3';

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

    const { transactions, loading: txLoading, fetchTransactions } = useBridgeTransactions();

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

    // Add these new states for network switching
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalance = async () => {
        if (!account || !contracts?.[sourceChain]?.token || isTransferring) return;

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
                        setError('');
                        setNeedsManualSwitch(false);
                        setNetworkName('');
                        
                        const result = await switchNetwork(sourceChain);
                        if (result.needsManualSwitch) {
                            setError(result.userMessage);
                            setNeedsManualSwitch(true);
                            setNetworkName(result.networkName);
                            setBalance('0');
                            return;
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (switchError) {
                        console.error('Network switch error in fetchBalance:', switchError);
                        setError(switchError.message);
                        setBalance('0');
                        return;
                    }
                }
            }

            const tokenContract = contracts[sourceChain].token;
            const balance = await tokenContract.methods.balanceOf(account).call();
            setBalance(Web3.utils.fromWei(balance, 'ether'));
        } catch (err) {
            console.error('Error fetching balance:', err);
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
                        setError('');
                        setNeedsManualSwitch(false);
                        setNetworkName('');
                        
                        const result = await switchNetwork(sourceChain);
                        if (result.needsManualSwitch) {
                            setError(result.userMessage);
                            setNeedsManualSwitch(true);
                            setNetworkName(result.networkName);
                            setNftBalance('0');
                            setOwnedNFTs([]);
                            return;
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (switchError) {
                        console.error('Network switch error in fetchOwnedNFTs:', switchError);
                        setError(switchError.message);
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

    const [needsManualSwitch, setNeedsManualSwitch] = useState(false);
    const [networkName, setNetworkName] = useState('');
    
    const handleChainSelection = async (e) => {
        const newNetwork = e.target.value;
        
        try {
            setError('');
            setNeedsManualSwitch(false);
            setNetworkName('');
            setIsLoading(true);
            
            const result = await switchNetwork(newNetwork);
            
            if (result.needsManualSwitch) {
                setError(result.userMessage);
                setNeedsManualSwitch(true);
                setNetworkName(result.networkName);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle transfer type changes
    useEffect(() => {
        const handleChainChanged = async (chainId) => {
            const networkMap = {
                '0x7A69': 'amoy',    // 31337
                '0x7A6A': 'sepolia'  // 31338
            };

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
    
    const handleTransfer = async () => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        if (!receiverAddress || !Web3.utils.isAddress(receiverAddress)) {
            setError('Invalid receiver address');
            return;
        }

        if (transferType === 'token' && (!amount || isNaN(amount) || parseFloat(amount) <= 0)) {
            setError('Invalid amount');
            return;
        }

        if (transferType === 'nft' && (!tokenId || isNaN(tokenId))) {
            setError('Invalid token ID');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            await handleBridgeTransfer(
                transferType,
                amount,
                tokenId,
                receiverAddress
            );

            setSuccess('Transfer completed successfully!');
            setAmount('');
            setTokenId('');
            setReceiverAddress('');
            
            // Refresh balances and transactions
            if (transferType === 'token') {
                await fetchBalance();
            } else {
                await fetchOwnedNFTs();
            }
            
            // Add delay before fetching transactions
            await new Promise(resolve => setTimeout(resolve, 2000));
            await fetchTransactions();

        } catch (err) {
            console.error('Transfer error:', err);
            setError(err.message || 'An error occurred during transfer');
        } finally {
            setLoading(false);
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

    // Effect for verifying selected network in metamask
    useEffect(() => {
        const verifyInitialNetwork = async () => {
            if (!account || !contracts?.[sourceChain]) return;

            try {
                const currentChainId = await window.ethereum.request({ 
                    method: 'eth_chainId' 
                });
                
                const expectedChainId = NETWORKS[sourceChain].chainId.toUpperCase();
                const actualChainId = currentChainId.toUpperCase();
                
                if (actualChainId !== expectedChainId) {
                    try {
                        setError('');
                        setNeedsManualSwitch(false);
                        setNetworkName('');
                        
                        const result = await switchNetwork(sourceChain);
                        if (result.needsManualSwitch) {
                            setError(result.userMessage);
                            setNeedsManualSwitch(true);
                            setNetworkName(result.networkName);
                        }
                    } catch (error) {
                        setError(error.message || 'Failed to switch to the correct network');
                    }
                }
            } catch (err) {
                console.error('Initial network verification error:', err);
                setError('Failed to verify network configuration');
            }
        };

        verifyInitialNetwork();
    }, [account, contracts, sourceChain]); // Run when account or contracts are initialized

    return (
        <div className="w-full">
            <h3 className='text-center font-bold text-2xl'>Cross Chain Bridge</h3>
            <div className="space-y-6">
                {/* Transfer Type Selection */}
                <div className="flex space-x-4 mb-6">
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                            transferType === 'token'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={() => setTransferType('token')}
                    >
                        Token Transfer
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                            transferType === 'nft'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={() => setTransferType('nft')}
                    >
                        NFT Transfer
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-600 font-medium mb-2">Network Switch Required</div>
                        <div className="text-red-500">{error}</div>
                        {needsManualSwitch && (
                            <div className="mt-4">
                                <div className="font-medium mb-2 text-gray-700">Please follow these steps:</div>
                                <ol className="list-decimal ml-4 space-y-1 text-sm text-gray-600">
                                    <li>Open MetaMask</li>
                                    <li>Select &quot;{networkName}&quot;</li>
                                    <li>Confirm network switch</li>
                                    <li>Return to continue</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {/* Balance Display */}
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
                    {transferType === 'token' ? (
                        <div>Balance on {sourceChain}: {isBalanceLoading ? 'Loading...' : `${balance} tokens`}</div>
                    ) : (
                        <div>NFT Balance on {sourceChain}: {isBalanceLoading ? 'Loading...' : `${nftBalance} NFTs`}</div>
                    )}
                </div>

                {/* Chain Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Source Chain</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                            transition duration-150 ease-in-out"
                            value={sourceChain}
                            onChange={handleChainSelection}
                            disabled={isLoading}
                        >
                            <option value="amoy">Amoy</option>
                            <option value="sepolia">Sepolia</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Chain</label>
                        <div className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                            {targetChain.charAt(0).toUpperCase() + targetChain.slice(1)}
                        </div>
                    </div>
                </div>

                {/* Transfer Form */}
                <div className="space-y-4">
                    {transferType === 'token' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 
                                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                transition duration-150 ease-in-out"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">NFT ID</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm 
                                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                transition duration-150 ease-in-out"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Address</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                            transition duration-150 ease-in-out"
                            value={receiverAddress}
                            onChange={(e) => setReceiverAddress(e.target.value)}
                            placeholder="Enter receiver address"
                        />
                    </div>

                    <button
                        className={`w-full py-3 px-4 rounded-lg transition-all duration-200 font-medium
                        ${loading
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm hover:shadow-md'
                        }`}
                        onClick={handleTransfer}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Transfer'}
                    </button>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
                        {success}
                    </div>
                )}

                {/* Transaction History */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                        <button
                            onClick={fetchTransactions}
                            className="inline-flex items-center px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm transition-colors duration-200"
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
    );
};

export default Bridge;