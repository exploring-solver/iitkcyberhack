import { useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';

type Transaction = {
  id: string;
  type: 'ERC20' | 'ERC721';
  tokenAddress: string;
  recipient: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
};

const mockTransactions: Transaction[] = [
  {
    id: '0x1234...5678',
    type: 'ERC20',
    tokenAddress: '0xabc...def',
    recipient: '0x789...012',
    amount: '100',
    status: 'completed',
    timestamp: '2024-03-10 14:30:00',
  },
  {
    id: '0x5678...9012',
    type: 'ERC721',
    tokenAddress: '0xdef...abc',
    recipient: '0x345...678',
    amount: '1',
    status: 'pending',
    timestamp: '2024-03-10 14:15:00',
  },
];

export function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions] = useState<Transaction[]>(mockTransactions);

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tokenAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Transaction History</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by transaction ID, token address, or recipient"
            className="w-full bg-gray-800 rounded-lg pl-10 pr-4 py-2 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Token Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {tx.tokenAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.recipient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`capitalize ${getStatusColor(tx.status)}`}>{tx.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {tx.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <button
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={() => window.open(`https://etherscan.io/tx/${tx.id}`)}
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}