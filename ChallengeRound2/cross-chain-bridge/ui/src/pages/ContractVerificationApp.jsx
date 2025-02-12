/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import your contract ABIs
import { MERKLE_VERIFIER_ABI, RELAYER_ABI, BRIDGE_ABI } from '../contracts/abis';

const ContractVerificationApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('merkle');
  const [status, setStatus] = useState({ type: '', message: '' });

  // Contract instances
  const [merkleVerifier, setMerkleVerifier] = useState(null);
  const [relayer, setRelayer] = useState(null);
  const [bridge, setBridge] = useState(null);

  // Replace with your deployed contract addresses
  const MERKLE_VERIFIER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const RELAYER_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const BRIDGE_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  useEffect(() => {
    const initializeEthereum = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const signer = web3Provider.getSigner();
          setSigner(signer);
          const address = await signer.getAddress();
          setAccount(address);

          // Initialize contract instances
          setMerkleVerifier(new ethers.Contract(
            MERKLE_VERIFIER_ADDRESS,
            MERKLE_VERIFIER_ABI,
            signer
          ));

          setRelayer(new ethers.Contract(
            RELAYER_ADDRESS,
            RELAYER_ABI,
            signer
          ));

          setBridge(new ethers.Contract(
            BRIDGE_ADDRESS,
            BRIDGE_ABI,
            signer
          ));

        } catch (error) {
          setStatus({
            type: 'error',
            message: 'Failed to connect: ' + error.message
          });
        }
      } else {
        setStatus({
          type: 'error',
          message: 'Please install MetaMask'
        });
      }
    };

    initializeEthereum();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="header mb-8">
        <h1 className="text-3xl font-bold mb-4">Contract Verification Dashboard</h1>
        <div className="account-info text-sm">
          Connected: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
        </div>
      </div>

      {status.message && (
        <div className={`status-message ${status.type === 'error' ? 'text-red-500' : 'text-green-500'} mb-4`}>
          {status.message}
        </div>
      )}

      <div className="tabs flex space-x-4 mb-8">
        <button 
          className={`tab px-4 py-2 rounded ${activeTab === 'merkle' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => setActiveTab('merkle')}
        >
          Merkle Verification
        </button>
        <button 
          className={`tab px-4 py-2 rounded ${activeTab === 'relayer' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => setActiveTab('relayer')}
        >
          Relayer
        </button>
        <button 
          className={`tab px-4 py-2 rounded ${activeTab === 'bridge' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => setActiveTab('bridge')}
        >
          Bridge
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'merkle' && (
          <MerkleVerifierPanel 
            contract={merkleVerifier} 
            setStatus={setStatus} 
          />
        )}
        {activeTab === 'relayer' && (
          <RelayerPanel 
            contract={relayer} 
            setStatus={setStatus}
            signer={signer}
          />
        )}
        {activeTab === 'bridge' && (
          <BridgePanel 
            contract={bridge} 
            setStatus={setStatus} 
          />
        )}
      </div>
    </div>
  );
};

const MerkleVerifierPanel = ({ contract, setStatus }) => {
  const [proof, setProof] = useState('');
  const [leaf, setLeaf] = useState('');

  const verifyProof = async () => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      const proofArray = JSON.parse(proof);
      const result = await contract.verify(proofArray, leaf);
      
      setStatus({
        type: 'success',
        message: `Verification result: ${result}`
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Verification failed: ' + error.message
      });
    }
  };

  return (
    <div className="panel bg-gray-800 p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Merkle Proof Verification</h2>
      <div className="form-group mb-4">
        <label className="block mb-2">Proof (JSON array format):</label>
        <textarea
          className="w-full p-2 bg-gray-700 rounded"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          placeholder='["0x123...", "0x456..."]'
        />
      </div>
      <div className="form-group mb-4">
        <label className="block mb-2">Leaf:</label>
        <input
          className="w-full p-2 bg-gray-700 rounded"
          type="text"
          value={leaf}
          onChange={(e) => setLeaf(e.target.value)}
          placeholder="0x789..."
        />
      </div>
      <button onClick={verifyProof} className="btn primary bg-blue-500 px-4 py-2 rounded">
        Verify Proof
      </button>
    </div>
  );
};

const RelayerPanel = ({ contract, setStatus, signer }) => {
  const [target, setTarget] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);

  const relayTransaction = async () => {
    try {
      setLoading(true);
      if (!contract || !signer) {
        throw new Error('Contract or signer not initialized');
      }

      // Generate signature for the relay transaction
      const nonce = Date.now();
      const message = ethers.utils.solidityKeccak256(
        ['address', 'bytes', 'uint256'],
        [target, data, nonce]
      );
      const signature = await signer.signMessage(ethers.utils.arrayify(message));

      const tx = await contract.relayTransaction(target, data, nonce, signature);
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: 'Transaction relayed successfully'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Relay failed: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel bg-gray-800 p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Transaction Relay</h2>
      <div className="form-group mb-4">
        <label className="block mb-2">Target Address:</label>
        <input
          className="w-full p-2 bg-gray-700 rounded"
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <div className="form-group mb-4">
        <label className="block mb-2">Transaction Data:</label>
        <input
          className="w-full p-2 bg-gray-700 rounded"
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <button 
        onClick={relayTransaction} 
        className="btn primary bg-blue-500 px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Relaying...' : 'Relay Transaction'}
      </button>
    </div>
  );
};

const BridgePanel = ({ contract, setStatus }) => {
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const lockAssets = async () => {
    try {
      setLoading(true);
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await contract.lockAssetERC20(
        token,
        ethers.utils.parseEther(amount)
      );
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: 'Assets locked successfully'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Lock failed: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel bg-gray-800 p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Bridge Operations</h2>
      <div className="form-group mb-4">
        <label className="block mb-2">Token Address:</label>
        <input
          className="w-full p-2 bg-gray-700 rounded"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="0x..."
        />
      </div>
      <div className="form-group mb-4">
        <label className="block mb-2">Amount:</label>
        <input
          className="w-full p-2 bg-gray-700 rounded"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.000000000000000001"
        />
      </div>
      <button 
        onClick={lockAssets} 
        className="btn primary bg-blue-500 px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Locking...' : 'Lock Assets'}
      </button>
    </div>
  );
};

export default ContractVerificationApp;