import { Code, Book, Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function DeveloperPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const codeExamples = {
    javascript: `import { GaslessForwarder } from '@gasless/sdk';

const forwarder = new GaslessForwarder({
  apiKey: 'YOUR_API_KEY',
  network: 'mainnet',
});

// Send ERC-20 tokens without gas
const tx = await forwarder.sendERC20({
  tokenAddress: '0x...',
  recipient: '0x...',
  amount: '1000000000000000000', // 1 token with 18 decimals
});`,
    solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@gasless/contracts/IGaslessForwarder.sol";

contract YourContract {
    IGaslessForwarder public forwarder;
    
    constructor(address _forwarder) {
        forwarder = IGaslessForwarder(_forwarder);
    }
    
    function executeWithoutGas(
        address token,
        address recipient,
        uint256 amount
    ) external {
        forwarder.forward(
            token,
            recipient,
            amount
        );
    }
}`,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 neon-text">
            <Code className="w-10 h-10 inline-block mr-4" />
            Developer Documentation
          </h1>
          <p className="text-gray-400">
            Integrate gasless transactions into your dApp
          </p>
        </div>

        {/* Quick Start */}
        <div className="glass-panel p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Terminal className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold">Quick Start</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Install via npm</span>
                <button
                  onClick={() =>
                    copyToClipboard('npm install @gasless/sdk', 'npm')
                  }
                  className="text-gray-400 hover:text-gray-300"
                >
                  {copied === 'npm' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <code className="text-blue-400">npm install @gasless/sdk</code>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Install via yarn</span>
                <button
                  onClick={() =>
                    copyToClipboard('yarn add @gasless/sdk', 'yarn')
                  }
                  className="text-gray-400 hover:text-gray-300"
                >
                  {copied === 'yarn' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <code className="text-blue-400">yarn add @gasless/sdk</code>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="glass-panel p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Book className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Code Examples</h2>
          </div>

          <div className="space-y-8">
            {/* JavaScript Example */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">JavaScript/TypeScript</h3>
                <button
                  onClick={() =>
                    copyToClipboard(codeExamples.javascript, 'js')
                  }
                  className="text-gray-400 hover:text-gray-300"
                >
                  {copied === 'js' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <pre className="bg-gray-800/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-blue-400">{codeExamples.javascript}</code>
              </pre>
            </div>

            {/* Solidity Example */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Solidity</h3>
                <button
                  onClick={() =>
                    copyToClipboard(codeExamples.solidity, 'sol')
                  }
                  className="text-gray-400 hover:text-gray-300"
                >
                  {copied === 'sol' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <pre className="bg-gray-800/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-blue-400">{codeExamples.solidity}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold mb-6">API Reference</h2>
          <div className="space-y-6">
            {['sendERC20', 'sendERC721', 'batchTransfer', 'estimateGas'].map(
              (method, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/80 transition-colors"
                >
                  <h3 className="font-medium mb-2">{method}()</h3>
                  <p className="text-sm text-gray-400">
                    View detailed documentation for the {method} method
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 text-sm mt-2">
                    Learn more →
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}