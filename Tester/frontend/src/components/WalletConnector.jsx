import { useConnect, useDisconnect } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

export const WalletConnector = () => {
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
      <div className="space-y-2">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="w-full p-2 bg-blue-500 text-white rounded"
            disabled={!connector.ready || isLoading}
          >
            {connector.name}
            {isLoading && connector.id === pendingConnector?.id && ' (connecting)'}
          </button>
        ))}
        <button
          onClick={() => disconnect()}
          className="w-full p-2 bg-red-500 text-white rounded"
        >
          Disconnect
        </button>
      </div>
      {error && <div className="text-red-500 mt-2">{error.message}</div>}
    </div>
  );
};