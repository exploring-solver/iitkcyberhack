import { useState } from 'react';
import { Shield, Zap, Bell, Wallet } from 'lucide-react';

type Settings = {
  defaultGasOption: 'sponsored' | 'user-paid';
  notifications: boolean;
  autoApprove: boolean;
  slippageTolerance: number;
};

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    defaultGasOption: 'sponsored',
    notifications: true,
    autoApprove: false,
    slippageTolerance: 0.5,
  });

  const handleSave = async () => {
    console.log('Settings saved:', settings);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 neon-text">Settings</h1>

        <div className="space-y-8">
          {/* Gas Preferences */}
          <div className="glass-panel p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold">Gas Preferences</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Gas Option
                </label>
                <select
                  className="cyber-input"
                  value={settings.defaultGasOption}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultGasOption: e.target.value as 'sponsored' | 'user-paid',
                    })
                  }
                >
                  <option value="sponsored">Always use sponsored gas</option>
                  <option value="user-paid">Pay gas fees manually</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slippage Tolerance
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={settings.slippageTolerance}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slippageTolerance: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-sm text-gray-400 mt-2">
                  Current: {settings.slippageTolerance}%
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="glass-panel p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold">Security</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-approve Trusted Contracts</h3>
                  <p className="text-sm text-gray-400">
                    Automatically approve transactions from whitelisted contracts
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoApprove}
                    onChange={(e) =>
                      setSettings({ ...settings, autoApprove: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-panel p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Bell className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Transaction Notifications</h3>
                  <p className="text-sm text-gray-400">
                    Receive notifications for transaction status updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) =>
                      setSettings({ ...settings, notifications: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Connected Wallets */}
          <div className="glass-panel p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Wallet className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold">Connected Wallets</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium">MetaMask</div>
                    <div className="text-sm text-gray-400">0x1234...5678</div>
                  </div>
                </div>
                <button className="text-red-400 hover:text-red-300 text-sm">
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="cyber-button">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}