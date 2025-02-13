import { useState, useEffect, useContext } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Web3Context } from '../context/Web3Context';

export default function TransactionHistory() {
  const { forwarder, account } = useContext(Web3Context);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (forwarder && account) {
        try {
          const events = await forwarder.getPastEvents('TransactionForwarded', {
            filter: { from: account },
            fromBlock: 0,
            toBlock: 'latest'
          });

          const formattedTransactions = await Promise.all(
            events.map(async (event) => {
              const block = await web3.eth.getBlock(event.blockNumber);
              return {
                hash: event.transactionHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: event.returnValues.value,
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
              };
            })
          );

          setTransactions(formattedTransactions);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransactions();
  }, [forwarder, account]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-100">Transaction History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Timestamp</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Transaction</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Recipient</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-300">{tx.timestamp}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="mr-2">{tx.hash.substring(0, 10)}...</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-mono">{tx.to}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {web3.utils.fromWei(tx.value, 'ether')} ETH
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}