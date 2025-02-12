import { useState, useCallback } from 'react';
import { useBridge } from '../contexts/BridgeContext';
import { useWeb3 } from '../contexts/Web3Context';
import Web3 from 'web3';

export function useBridgeTransactions() {
    const { account, sourceChain, targetChain, contracts } = useBridge();
    const { provider } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const fetchTransactions = useCallback(async () => {
        if (!account || !contracts) return;
        
        setLoading(true);
        try {
            // Get all relevant events from the contracts
            const fetchEvents = async (contract, eventName) => {
                try {
                    const latestBlock = await provider.getBlockNumber();
                    const fromBlock = Math.max(0, latestBlock - 10000); // Ensure we don't go below 0

                    return await contract.getPastEvents(eventName, {
                        fromBlock: fromBlock,
                        toBlock: 'latest',
                        filter: {} // Remove the user filter as it's handled in the returnValues
                    });
                } catch (error) {
                    console.error(`Error fetching ${eventName} events:`, error);
                    return [];
                }
            };

            let allEvents = [];

            if (sourceChain === 'amoy') {
                // Fetch token events
                const lockEvents = await fetchEvents(contracts.amoy.bridge, 'Locked');
                const unlockEvents = await fetchEvents(contracts.amoy.bridge, 'Unlocked');
                
                // Fetch NFT events
                const nftLockEvents = await fetchEvents(contracts.amoy.nftBridge, 'Locked');
                const nftUnlockEvents = await fetchEvents(contracts.amoy.nftBridge, 'Unlocked');
                const mintEvents = await fetchEvents(contracts.amoy.nftBridge, 'Minted');

                allEvents = [
                    ...lockEvents.map(e => ({ ...e, type: 'Token Lock' })),
                    ...unlockEvents.map(e => ({ ...e, type: 'Token Unlock' })),
                    ...nftLockEvents.map(e => ({ ...e, type: 'NFT Lock' })),
                    ...nftUnlockEvents.map(e => ({ ...e, type: 'NFT Unlock' })),
                    ...mintEvents.map(e => ({ ...e, type: 'NFT Mint' }))
                ];
            } else {
                // Fetch Sepolia events
                const releaseEvents = await fetchEvents(contracts.sepolia.bridge, 'Released');
                const burnEvents = await fetchEvents(contracts.sepolia.bridge, 'Burned');
                
                // Fetch NFT events
                const nftReleaseEvents = await fetchEvents(contracts.sepolia.nftBridge, 'Released');
                const nftBurnEvents = await fetchEvents(contracts.sepolia.nftBridge, 'Burned');

                allEvents = [
                    ...releaseEvents.map(e => ({ ...e, type: 'Token Release' })),
                    ...burnEvents.map(e => ({ ...e, type: 'Token Burn' })),
                    ...nftReleaseEvents.map(e => ({ ...e, type: 'NFT Release' })),
                    ...nftBurnEvents.map(e => ({ ...e, type: 'NFT Burn' }))
                ];
            }

            // Filter events for the current user
            const userEvents = allEvents.filter(event => {
                const eventUser = event.returnValues.from || event.returnValues.user;
                return eventUser?.toLowerCase() === account.toLowerCase();
            });

            // Format transactions
            const formattedTxs = userEvents.map(event => ({
                hash: event.transactionHash,
                blockNumber: event.blockNumber,
                type: event.type,
                amount: event.returnValues.amount 
                    ? Web3.utils.fromWei(event.returnValues.amount, 'ether')
                    : event.returnValues.tokenId,
                eventName: event.event,
                timestamp: Date.now() // Since timestamp might not be in the event, use current time
            }));

            // Sort by block number (descending)
            formattedTxs.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

            setTransactions(formattedTxs);
        } catch (err) {
            console.error('Error fetching bridge transactions:', err);
            setError('Failed to fetch bridge transactions');
        } finally {
            setLoading(false);
        }
    }, [account, provider, contracts, sourceChain]);

    return {
        transactions,
        loading,
        error,
        fetchTransactions
    };
}