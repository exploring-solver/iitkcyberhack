import { useState, useContext } from "react";
import { Menu, X, Wallet } from "lucide-react";
import { Web3Context } from "../contexts/Web3Context";
import { truncateAddress } from "../utils/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { account, connectWallet, loading, error, networkName, disconnectWallet } = useContext(Web3Context);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0">
              <span className="text-white text-2xl font-bold">CrossChain</span>
            </a>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a
                  href="/"
                  className="text-white hover:bg-indigo-500 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </a>
                <a
                  href="/transfer"
                  className="text-white hover:bg-indigo-500 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Transfer
                </a>
                <a
                  href="/history"
                  className="text-white hover:bg-indigo-500 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium"
                >
                  History
                </a>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            {account ? (
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500 bg-opacity-75 px-4 py-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-medium">
                      {truncateAddress(account)} ({networkName})
                    </span>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition duration-300 ease-in-out"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="bg-white text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Connecting...</span>
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-600 rounded-full border-t-transparent"></div>
                    </div>
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
                {error && (
                  <span className="text-red-500 text-sm">{error}</span>
                )}
              </div>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="/"
              onClick={handleLinkClick}
              className="text-white hover:bg-indigo-500 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </a>
            <a
              href="/transfer"
              onClick={handleLinkClick}
              className="text-white hover:bg-indigo-500 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium"
            >
              Transfer
            </a>
            <a
              href="/history"
              onClick={handleLinkClick}
              className="text-white hover:bg-indigo-500 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium"
            >
              History
            </a>
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-500">
            <div className="px-2">
              {account ? (
                <div className="bg-indigo-500 bg-opacity-75 px-4 py-2 rounded-md">
                  <div className="flex items-center justify-center space-x-2">
                    <Wallet className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-medium">
                      {truncateAddress(account)} ({networkName})
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full bg-white text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;