import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import ERC20_ABI from '../contracts/TestTokens.json';
import ERC721_ABI from '../contracts/TestNFTs.json';

export function useTokenBalance(tokenAddress) {
  const { account, provider } = useWeb3();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account || !provider || !tokenAddress) {
        console.log('Missing dependencies: account, provider, or tokenAddress');
        return;
      }

      try {
        console.log(`Fetching token balance for ${account} from contract: ${tokenAddress}`);
        setLoading(true);
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI.abi, provider);
        console.log('ERC20 Contract instance created:', contract);

        const balance = await contract.balanceOf(account);
        console.log(`Raw balance from contract: ${balance.toString()}`);

        const formattedBalance = ethers.formatEther(balance);
        console.log(`Formatted balance: ${formattedBalance}`);

        setBalance(formattedBalance);
        setError(null);
      } catch (err) {
        console.error('Error fetching token balance:', err);
        setError('Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [account, provider, tokenAddress]);

  return { balance, loading, error };
}

export function useNFTs(contractAddress) {
  const { account, provider } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!account || !provider || !contractAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use the abi property from the imported artifact
        const contract = new ethers.Contract(contractAddress, ERC721_ABI.abi, provider);
        console.log("nft contract", contract);
        // Get the balance of NFTs for the account
        const balance = await contract.balanceOf(account);
        console.log('NFT Balance:', balance.toString());

        const tokenIds = [];
        // Fetch token IDs directly since we're using the full contract ABI
        for (let i = 0; i < 10; i++) {
          const tokenId = i + 1; // Since our contract starts from token ID 1
          try {
            const owner = await contract.ownerOf(tokenId);
            console.log("owner",owner)
            if (owner.toLowerCase() === account.toLowerCase()) {
              tokenIds.push(tokenId.toString());
            }
          } catch (err) {
            console.log(`Token ${tokenId} not owned by account`);
          }
        }

        console.log('Found token IDs:', tokenIds);

        const nftData = await Promise.all(
          tokenIds.map(async (tokenId) => {
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              console.log(`Token URI for ${tokenId}:`, tokenURI);

              // For our test NFTs, create placeholder metadata
              // since we're using "ipfs://QmTest/" format
              const metadata = {
                name: `Test NFT #${tokenId}`,
                description: 'A test NFT for blockchain testing',
                image: `/api/placeholder/300/300?text=NFT%20${tokenId}`
              };

              return {
                tokenId,
                tokenURI,
                metadata
              };
            } catch (err) {
              console.error(`Error fetching metadata for token ${tokenId}:`, err);
              return {
                tokenId,
                tokenURI: '',
                metadata: {
                  name: `Token #${tokenId}`,
                  description: 'Error loading metadata',
                  image: null
                }
              };
            }
          })
        );

        console.log('Final NFT data:', nftData);
        setNfts(nftData);
        setError(null);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError('Failed to fetch NFTs: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [account, provider, contractAddress]);

  return { nfts, loading, error };
}

export function useTransactionHistory() {
  const { account, provider } = useWeb3();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!account || !provider) {
      console.log('Missing dependencies: account or provider');
      return;
    }

    try {
      console.log(`Fetching transaction history for ${account}`);
      setLoading(true);
      setError(null);

      const currentBlock = await provider.getBlockNumber();
      console.log(`Current block number: ${currentBlock}`);
      const fromBlock = Math.max(0, currentBlock - 1000); // Look back 1000 blocks

      // Get all blocks in range
      const blocks = await Promise.all(
        Array.from({ length: currentBlock - fromBlock + 1 }, (_, i) => 
          provider.getBlock(fromBlock + i, true)
        )
      );

      // Filter and process transactions
      const txs = blocks
        .filter(block => block !== null)
        .flatMap(block => block.transactions)
        .filter(tx => 
          tx.from?.toLowerCase() === account.toLowerCase() || 
          tx.to?.toLowerCase() === account.toLowerCase()
        );

      const txData = await Promise.all(
        txs.map(async (tx) => {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.formatEther(tx.value.toString()),
            data: tx.data !== '0x' ? 'Contract Interaction' : 'Transfer',
            status: receipt?.status,
            blockNumber: tx.blockNumber,
            timestamp: block.timestamp,
            gasUsed: receipt?.gasUsed.toString(),
            gasPrice: ethers.formatEther(tx.gasPrice.toString())
          };
        })
      );
      console.log(txData);
      // Sort by block number in descending order
      const sortedTxs = txData.sort((a, b) => b.blockNumber - a.blockNumber);
      
      console.log('Final transaction history:', sortedTxs);
      setTransactions(sortedTxs);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to fetch transactions: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [account, provider]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refreshTransactions: fetchTransactions };
}
