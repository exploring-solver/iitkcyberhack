import { ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";

const History = () => {
  // Dummy data for transfers
  const transfers = [
    {
      id: "1",
      fromChain: "Amoy",
      toChain: "Sepolia",
      amount: "100",
      asset: "ETH",
      status: "Completed",
      timestamp: Date.now() - 3600000, // 1 hour ago
    },
    {
      id: "2",
      fromChain: "Sepolia",
      toChain: "Amoy",
      amount: "50",
      asset: "USDC",
      status: "Pending",
      timestamp: Date.now() - 7200000, // 2 hours ago
    },
    {
      id: "3",
      fromChain: "Amoy",
      toChain: "Sepolia",
      amount: "25",
      asset: "ETH",
      status: "Failed",
      timestamp: Date.now() - 10800000, // 3 hours ago
    },
  ];

  // Function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="text-green-500 h-5 w-5" />;
      case "Failed":
        return <XCircle className="text-red-500 h-5 w-5" />;
      case "Pending":
        return <Clock className="text-yellow-500 h-5 w-5" />;
      default:
        return null;
    }
  };

  // Function to format timestamp
  const formatDate = (timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-indigo-600">Transfer History</h1>
      <div className="bg-gray-800 text-gray-100 shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full border border-gray-700">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              {["From", "To", "Amount", "Asset", "Status", "Time"].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-gray-700">
                <td className="px-6 py-4">{transfer.fromChain}</td>
                <td className="px-6 py-4 flex items-center">
                  <ArrowRight className="mr-2 text-gray-400 h-4 w-4" />
                  {transfer.toChain}
                </td>
                <td className="px-6 py-4">{transfer.amount}</td>
                <td className="px-6 py-4">{transfer.asset}</td>
                <td className="px-6 py-4 flex items-center">
                  {getStatusIcon(transfer.status)}
                  <span className="ml-2">{transfer.status}</span>
                </td>
                <td className="px-6 py-4">{formatDate(transfer.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;