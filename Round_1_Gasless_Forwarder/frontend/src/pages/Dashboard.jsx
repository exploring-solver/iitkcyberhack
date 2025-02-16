import { useState, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import TestToken from '../contracts/TestToken.json';
import { Loader } from 'lucide-react';

export default function Dashboard() {
  const { web3, account, forwarder, loading: web3Loading } = useContext(Web3Context);
  const [formData, setFormData] = useState({
    tokenAddress: '',
    recipient: '',
    amount: '',
  });
  const [permitData, setPermitData] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSignPermit = async () => {
    try {
      setLoading(true);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No authorized accounts found');
      }

      const tokenContract = new web3.eth.Contract(
        TestToken.abi,
        formData.tokenAddress
      );

      // Check token balance
      const balance = await tokenContract.methods.balanceOf(account).call();
      const amount = web3.utils.toWei(formData.amount.toString(), 'ether');

      if (BigInt(amount) > BigInt(balance)) {
        throw new Error('Insufficient token balance');
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await tokenContract.methods.nonces(account).call();
      const chainId = await web3.eth.getChainId();
      const name = await tokenContract.methods.name().call();
      const version = '1';

      const domain = {
        name: name,
        version: version,
        chainId: chainId.toString(),
        verifyingContract: formData.tokenAddress
      };

      const permit = {
        owner: account,
        spender: forwarder._address,
        value: amount.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString()
      };

      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        },
        primaryType: 'Permit',
        domain: domain,
        message: permit
      };

      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [account, JSON.stringify(typedData)],
      });

      const r = signature.slice(0, 66);
      const s = '0x' + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      // Store permit data for the recipient
      const permitInfo = {
        tokenAddress: formData.tokenAddress,
        from: account,
        to: formData.recipient,
        amount: amount,
        deadline: deadline,
        v: Number(v),             // Ensure v is a number
        r: r,                     // Should be 32 bytes
        s: s                      // Should be 32 bytes
      };

      setPermitData(permitInfo);
      setStatus({
        type: 'success',
        message: 'Permit signed! Share the permit data with the recipient.'
      });

    } catch (error) {
      console.error('Signing failed:', error);
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransfer = async () => {
    try {
      setLoading(true);

      if (!permitData) {
        throw new Error('No permit data available');
      }

      // Add debug logs
      console.log('Current account:', account);
      console.log('Permit data:', permitData);

      // Check if current account is recipient
      // if (account.toLowerCase() !== permitData.to.toLowerCase()) {
      //   throw new Error('Only the recipient can execute the transfer');
      // }

      // Check if permit hasn't expired
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (parseInt(permitData.deadline) < currentTimestamp) {
        throw new Error('Permit has expired');
      }

      // Check token balance
      const tokenContract = new web3.eth.Contract(TestToken.abi, permitData.tokenAddress);
      const balance = await tokenContract.methods.balanceOf(permitData.from).call();
      console.log('Token balance of sender:', balance);
      console.log('Amount to transfer:', permitData.amount);

      // Convert to BigInt for comparison
      const balanceBigInt = BigInt(balance);
      const amountBigInt = BigInt(permitData.amount);

      if (balanceBigInt < amountBigInt) {
        throw new Error('Insufficient token balance');
      }

      // Check current allowance
      const allowance = await tokenContract.methods
        .allowance(permitData.from, forwarder._address)
        .call();
      console.log('Current allowance:', allowance);

      // Convert deadline to number if it's a BigInt
      const deadlineValue = typeof permitData.deadline === 'bigint'
        ? Number(permitData.deadline)
        : permitData.deadline;
      console.log('Signature components:', {
        v: permitData.v,
        r: permitData.r,
        s: permitData.s,
        vType: typeof permitData.v,
        rType: typeof permitData.r,
        sType: typeof permitData.s
      });
      // Get gas estimate
      const gasEstimate = await forwarder.methods
        .forwardERC20TransferWithPermit(
          permitData.tokenAddress,
          permitData.from,
          permitData.to,
          permitData.amount.toString(),
          deadlineValue,
          permitData.v,
          permitData.r,
          permitData.s
        )
        .estimateGas({ from: account });

      console.log('Estimated gas:', gasEstimate);

      // Convert gasEstimate from BigInt to number and add 20% buffer
      const gasLimit = Number(gasEstimate) + Math.floor(Number(gasEstimate) * 0.2);
      console.log('Gas limit with buffer:', gasLimit);

      const tx = await forwarder.methods
        .forwardERC20TransferWithPermit(
          permitData.tokenAddress,
          permitData.from,
          permitData.to,
          permitData.amount.toString(),
          deadlineValue,
          permitData.v,          // Make sure this is a number
          permitData.r,          // Should be 32 bytes
          permitData.s           // Should be 32 bytes
        )
        .send({
          from: account,
          gas: gasLimit
        });

      console.log('Transaction successful:', tx);

      setStatus({
        type: 'success',
        message: 'Transfer completed successfully!'
      });

    } catch (error) {
      console.error('Transfer execution failed:', error);
      // Extract more detailed error message if available
      const errorMessage = error.message.includes('execution reverted')
        ? error.message.split('execution reverted:')[1].trim()
        : error.message;
      setStatus({
        type: 'error',
        message: `Transfer failed: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Gasless Token Transfer with Permit</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Token Address</label>
              <input
                className="w-full bg-gray-100 rounded-lg p-3 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.tokenAddress}
                onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Recipient Address</label>
              <input
                className="w-full bg-gray-100 rounded-lg p-3 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Amount</label>
              <input
                type="number"
                className="w-full bg-gray-100 rounded-lg p-3 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.0"
              />
            </div>

            <button
              onClick={handleSignPermit}
              disabled={loading || !account}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center"
            >
              {loading ? (
                <Loader className="animate-spin h-5 w-5 text-white" />
              ) : (
                'Sign Permit'
              )}
            </button>

            {permitData && (
              <button
                onClick={handleExecuteTransfer}
                disabled={loading || account === permitData.from}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center"
              >
                {loading ? (
                  <Loader className="animate-spin h-5 w-5 text-white" />
                ) : (
                  'Execute Transfer (Recipient Only)'
                )}
              </button>
            )}

            {status.message && (
              <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
                {status.message}
              </div>
            )}

            {permitData && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3 text-gray-900">Permit Data:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
                  {JSON.stringify(permitData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}