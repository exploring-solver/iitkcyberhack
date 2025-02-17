import { Wallet, Send, Coins, Image,Github, History, BriefcaseIcon } from "lucide-react"
import WalletConnection from "./WalletConnection";
import TokenManagement from "./TokenManagement";
import NFTManagement from "./NFTManagement";
import TransactionHistory from "./TransactionHistory";
import Transfer from "./Transfer";
import { useWeb3 } from "../contexts/Web3Context";
import BridgeComponent from "./Bridge";

const Dashboard = () => {
  const { account } = useWeb3();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 shadow-sm bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-purple-600">Eno Bridge</h1>
        {account && (
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-100 text-sm font-medium">
            <Wallet className="w-4 h-4 text-purple-500" />
            <span className="text-purple-700">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-6">
        <div className="space-y-4">
          {/* Wallet Connection Section */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
            <WalletConnection />
          </section>

          {/* Features (Only visible if wallet is connected) */}
          {account ? (
            <>
              {/* Bridge Section */}
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <BridgeComponent />
                  </div>
                </div>
              </section>

              {/* Transfer Section */}
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Send className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <Transfer />
                  </div>
                </div>
              </section>

              {/* Token Management Section */}
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Coins className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <TokenManagement />
                  </div>
                </div>
              </section>

              

              {/* NFT Management Section */}
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Image className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <NFTManagement />
                  </div>
                </div>
              </section>

              {/* Transaction History Section */}
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <History className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <TransactionHistory />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="max-w-md mx-auto">
                <Wallet className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</p>
                <p className="text-gray-500">Connect your wallet to access Eno Bridge features and start managing your assets.</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>Made with ❤️ by Team Sangathan</span>
          <span className="px-2">•</span>
          <span>Eno Bridge</span>
          <span className="px-2">•</span>
          <a 
            href="https://github.com/exploring-solver/iitkcyberhack" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 p-1 hover:text-purple-600 transition-colors duration-200"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
