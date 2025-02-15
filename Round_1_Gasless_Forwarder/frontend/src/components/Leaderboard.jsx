import { useState } from 'react';
import { Trophy, Zap, Award, TrendingUp } from 'lucide-react';

export function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState('weekly');
  const [leaderboard] = useState([
    {
      rank: 1,
      address: '0x1234...5678',
      transactionCount: 156,
      gasSaved: '45.5 ETH',
      points: 12500,
    },
    {
      rank: 2,
      address: '0x5678...9012',
      transactionCount: 142,
      gasSaved: '42.3 ETH',
      points: 11800,
    },
    {
      rank: 3,
      address: '0x9012...3456',
      transactionCount: 128,
      gasSaved: '38.7 ETH',
      points: 10900,
    },
  ]);

  const stats = [
    {
      label: 'Total Gas Saved',
      value: '2,450 ETH',
      icon: Zap,
      color: 'text-yellow-400',
    },
    {
      label: 'Active Users',
      value: '50K+',
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Total Points',
      value: '1.2M',
      icon: Award,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              <Trophy className="w-10 h-10 inline-block mr-4" />
              Leaderboard
            </h1>
            <p className="text-gray-500">Top performers in gas-free transactions</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <span className="text-sm text-gray-500">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                </div>
              );
            })}
          </div>

          {/* Timeframe Selection */}
          <div className="flex justify-center mb-8 space-x-2">
            {['daily', 'weekly', 'monthly', 'all'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-hidden rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Address</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Transactions</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Gas Saved</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-400" />}
                          {entry.rank === 2 && <Trophy className="w-5 h-5 text-gray-400" />}
                          {entry.rank === 3 && <Trophy className="w-5 h-5 text-orange-400" />}
                          <span className="font-bold text-gray-900">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-900">{entry.address}</td>
                      <td className="px-6 py-4 text-gray-900">{entry.transactionCount}</td>
                      <td className="px-6 py-4 text-gray-900">{entry.gasSaved}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-purple-400" />
                          <span className="text-gray-900">{entry.points.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}