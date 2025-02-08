import { useState } from 'react';
import { Wallet, Coins, BarChart3, ArrowUpRight, Bell, Gift } from 'lucide-react';

type Token = {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  type: 'ERC20' | 'ERC721';
  address: string;
  network: string;
};

type Notification = {
  id: string;
  type: 'success' | 'pending' | 'error';
  message: string;
  timestamp: string;
};

export function DashboardPage() {
  const [tokens] = useState<Token[]>([
    {
      symbol: 'USDT',
      name: 'Tether USD',
      balance: '1,000.00',
      value: '$1,000.00',
      type: 'ERC20',
      address: '0x1234...5678',
      network: 'Ethereum',
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      balance: '500',
      value: '$400',
      type: 'ERC20',
      address: '0x5678...9012',
      network: 'Polygon',
    },
    {
      symbol: 'BAYC',
      name: 'Bored Ape Yacht Club',
      balance: '2',
      value: '200 ETH',
      type: 'ERC721',
      address: '0x9012...3456',
      network: 'Ethereum',
    },
  ]);

  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      message: 'Transaction confirmed on Ethereum',
      timestamp: '2 mins ago',
    },
    {
      id: '2',
      type: 'pending',
      message: 'Bridging assets to Polygon',
      timestamp: '5 mins ago',
    },
  ]);

  const stats = [
    { label: 'Total Balance', value: '$5,450', icon: Wallet },
    { label: 'Gas Credits', value: '2.5 ETH', icon: Coins },
    { label: 'Transactions', value: '156', icon: BarChart3 },
  ];

  const [showReferral, setShowReferral] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Notifications */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold neon-text">Notifications</h2>
          <Bell className="w-6 h-6 text-blue-400" />
        </div>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="glass-panel p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    notification.type === 'success'
                      ? 'bg-green-400'
                      : notification.type === 'pending'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                />
                <span>{notification.message}</span>
              </div>
              <span className="text-sm text-gray-400">{notification.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stats-card">
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8 text-blue-400" />
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold neon-text">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Referral Program */}
      <div className="glass-panel p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold neon-text">Referral Program</h2>
            <p className="text-gray-400">Earn gas credits by inviting friends</p>
          </div>
          <Gift className="w-8 h-8 text-purple-400" />
        </div>
        <button
          onClick={() => setShowReferral(!showReferral)}
          className="cyber-button w-full"
        >
          {showReferral ? 'Hide Referral Link' : 'Get Referral Link'}
        </button>
        {showReferral && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Your referral link:</p>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                readOnly
                value="https://gasless.app/ref/YOUR_ID"
                className="cyber-input flex-1"
              />
              <button className="cyber-button bg-gray-800">Copy</button>
            </div>
          </div>
        )}
      </div>

      {/* Token Balances */}
      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 neon-text">Token Balances</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6">Token</th>
                <th className="text-left py-4 px-6">Network</th>
                <th className="text-left py-4 px-6">Balance</th>
                <th className="text-left py-4 px-6">Value</th>
                <th className="text-left py-4 px-6">Type</th>
                <th className="text-left py-4 px-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                      {token.network}
                    </span>
                  </td>
                  <td className="py-4 px-6">{token.balance}</td>
                  <td className="py-4 px-6">{token.value}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                      {token.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button className="cyber-button py-1 px-4 text-sm">
                      Send
                      <ArrowUpRight className="w-4 h-4 inline-block ml-2" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-6 neon-text">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/80">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium">Sent 100 USDT</div>
                  <div className="text-sm text-gray-400">To: 0x1234...5678</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400">Completed</div>
                <div className="text-sm text-gray-400">2 mins ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}