import { ArrowRight, Wallet, Shield, Zap, ChevronDown, Layers } from 'lucide-react';
import { useState } from 'react';

export function HomePage() {
  const [formData, setFormData] = useState({
    tokenType: 'erc20',
    tokenAddress: '',
    recipientAddress: '',
    amount: '',
    network: 'ethereum',
    gasSpeed: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Transaction submitted:', formData);
  };

  const stats = [
    { label: 'Total Transactions', value: '1.2M+' },
    { label: 'Gas Saved (ETH)', value: '2,450' },
    { label: 'Active Users', value: '50K+' },
    { label: 'Supported Chains', value: '5+' },
  ];

  const networks = [
    { id: 'ethereum', name: 'Ethereum', icon: '🌐' },
    { id: 'polygon', name: 'Polygon', icon: '⬡' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { id: 'optimism', name: 'Optimism', icon: '🔴' },
  ];

  const gasSpeeds = [
    { id: 'slow', name: 'Eco', price: '20 Gwei', time: '~5 mins' },
    { id: 'medium', name: 'Standard', price: '25 Gwei', time: '~2 mins' },
    { id: 'fast', name: 'Turbo', price: '30 Gwei', time: '~30 secs' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {networks.map((network) => (
                <div key={network.id} className="glass-panel px-4 py-2 flex items-center space-x-2">
                  <span>{network.icon}</span>
                  <span>{network.name}</span>
                </div>
              ))}
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
              Cross-Chain Gasless Transactions
            </h1>
            <p className="text-xl text-gray-300 mb-12">
              Send tokens without ETH across multiple chains. Fast, secure, and completely gasless.
            </p>
            <div className="flex justify-center gap-6">
              <button className="cyber-button">
                Get Started
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </button>
              <button className="cyber-button bg-gray-800 hover:bg-gray-700">
                Learn More
                <ChevronDown className="w-5 h-5 inline-block ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="stats-card">
                <h3 className="text-4xl font-bold neon-text mb-2">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-16 neon-text">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 animate-float" style={{ animationDelay: '0s' }}>
              <Wallet className="w-12 h-12 mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-4">Connect Wallet</h3>
              <p className="text-gray-400">Link your wallet to start making gasless transactions</p>
            </div>
            <div className="glass-panel p-8 animate-float" style={{ animationDelay: '0.2s' }}>
              <Shield className="w-12 h-12 mb-4 text-green-400" />
              <h3 className="text-xl font-semibold mb-4">Select Chain & Token</h3>
              <p className="text-gray-400">Choose your preferred network and token for transfer</p>
            </div>
            <div className="glass-panel p-8 animate-float" style={{ animationDelay: '0.4s' }}>
              <Zap className="w-12 h-12 mb-4 text-yellow-400" />
              <h3 className="text-xl font-semibold mb-4">Send Instantly</h3>
              <p className="text-gray-400">Complete your transfer without paying any gas fees</p>
            </div>
          </div>
        </div>

        {/* Transaction Form */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto glass-panel p-8">
            <h2 className="text-2xl font-bold mb-6 neon-text">Quick Transfer</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Network</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, network: network.id })}
                      className={`p-4 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                        formData.network === network.id
                          ? 'bg-blue-600 neon-border'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span>{network.icon}</span>
                      <span>{network.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Token Type</label>
                <select
                  className="cyber-input"
                  value={formData.tokenType}
                  onChange={(e) => setFormData({ ...formData, tokenType: e.target.value })}
                >
                  <option value="erc20">ERC-20</option>
                  <option value="erc721">ERC-721</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Token Address</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="0x..."
                  value={formData.tokenAddress}
                  onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Recipient Address</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="0x..."
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              {/* Gas Speed Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Gas Speed</label>
                <div className="grid grid-cols-3 gap-4">
                  {gasSpeeds.map((speed) => (
                    <button
                      key={speed.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, gasSpeed: speed.id })}
                      className={`p-4 rounded-lg text-center transition-all ${
                        formData.gasSpeed === speed.id
                          ? 'bg-blue-600 neon-border'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium">{speed.name}</div>
                      <div className="text-sm text-gray-400">{speed.price}</div>
                      <div className="text-xs text-gray-500">{speed.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="cyber-button w-full">
                Send Transaction
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </button>
            </form>
          </div>
        </div>

        {/* NFT Gated Features */}
        <div className="container mx-auto px-4 py-16">
          <div className="glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold neon-text">Premium Features</h2>
                <p className="text-gray-400">Unlock exclusive benefits with NFT membership</p>
              </div>
              <Layers className="w-12 h-12 text-purple-400" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="font-medium mb-2">Priority Relaying</h3>
                <p className="text-sm text-gray-400">Skip the queue with instant transaction processing</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="font-medium mb-2">Advanced Analytics</h3>
                <p className="text-sm text-gray-400">Detailed insights into your transaction history</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="font-medium mb-2">Custom Gas Rules</h3>
                <p className="text-sm text-gray-400">Set personalized gas price thresholds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}