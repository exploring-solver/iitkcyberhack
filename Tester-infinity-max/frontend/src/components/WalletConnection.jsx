// import React from "react";
import { Wallet, RefreshCcw, Network } from "lucide-react";
import { useWeb3 } from "../contexts/Web3Context";

const WalletConnection = () => {
  const {
    account,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    switchChain,
    fetchBalance,
  } = useWeb3();

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case "0xAA36A7":
        return "Sepolia";
      case "0x13882":
        return "Amoy";
      case "0x7a69":
        return "Local Amoy";
      case "0x7a6a":
        return "Local Sepolia";
      default:
        return "Unknown Network";
    }
  };

  const handleFetchBalance = async () => {
    if (account) {
      await fetchBalance(account);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg border border-gray-200 rounded-lg">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Wallet Connection</h2>
        <button
          onClick={account ? disconnectWallet : connectWallet}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
            account
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {account ? "Disconnect" : "Connect Wallet"}
        </button>
      </div>

      {/* Wallet Info */}
      {account ? (
        <div className="space-y-3 text-gray-700 text-sm">
          <p>
            <Wallet className="inline w-4 h-4 mr-1 text-gray-500" />
            Account: <span className="font-medium">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
          </p>
          <p>
            <Network className="inline w-4 h-4 mr-1 text-gray-500" />
            Network: <span className="font-medium">{getNetworkName(chainId)}</span>
          </p>
          <div className="flex items-center gap-2">
            <p className="flex items-center">
              💰 Balance:{" "}
              {balance ? (
                <span className="font-medium ml-1">
                  {parseFloat(balance).toFixed(4)}{" "}
                  {chainId === "0x13882"
                    ? "MATIC"
                    : chainId === "0x7a69"
                    ? "TEST"
                    : chainId === "0x7a6a"
                    ? "Wrapped TEST"
                    : "ETH"}
                </span>
              ) : (
                <span className="text-gray-500 ml-1">Click to fetch</span>
              )}
            </p>
            <button
              onClick={handleFetchBalance}
              className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
            >
              <RefreshCcw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Wallet not connected</p>
      )}

      {/* Network Switch Buttons */}
      {account && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => switchChain("0xaa36a7")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              chainId === "0xaa36a7"
                ? "bg-purple-100 text-purple-800 border border-purple-300"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            Switch to Sepolia
          </button>
          <button
            onClick={() => switchChain("0x13882")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              chainId === "0x13882"
                ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            Switch to Amoy
          </button>
          <button
            onClick={() => switchChain("0x7a69")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              chainId === "0x7a69"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            Local Amoy (8545)
          </button>
          <button
            onClick={() => switchChain("0x7a6a")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              chainId === "0x7a6a"
                ? "bg-teal-100 text-teal-800 border border-teal-300"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            Local Sepolia (8546)
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
