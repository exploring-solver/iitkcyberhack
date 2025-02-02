import { Button } from "@mui/material";
import { ArrowRightCircle, CheckCircle2, Lock } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500">
        <h2 className="text-4xl font-bold mb-6">Seamless Cross-Chain Asset Transfers</h2>
        <p className="text-lg max-w-2xl mb-8">
          Lock your assets on one blockchain and mint their equivalent representation on another. Experience secure, transparent, and efficient cross-chain transactions.
        </p>
        <Button
          variant="contained"
          color="secondary"
          endIcon={<ArrowRightCircle />}
          className="capitalize"
            href="/transfer"
        >
          Get Started
        </Button>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-12">Core Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <Lock className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Lock & Mint</h4>
            <p className="text-sm text-gray-300">
              Lock ERC-20 or ERC-721 assets on Chain A and mint their equivalent on Chain B.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Proof of Transfer</h4>
            <p className="text-sm text-gray-300">
              Generate a secure receipt for every transfer, including hash, timestamp, and other details.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <ArrowRightCircle className="w-12 h-12 mx-auto text-pink-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Smooth UI</h4>
            <p className="text-sm text-gray-300">
              Connect your wallet and view transfer status, logs, and transaction history seamlessly.
            </p>
          </div>
        </div>
      </section>

     
    </div>
  );
};

export default HomePage;
