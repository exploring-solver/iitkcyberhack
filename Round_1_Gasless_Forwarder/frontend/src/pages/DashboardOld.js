// import React, { useState, useContext, useEffect } from 'react';
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   TextField,
//   Button,
//   Grid,
//   MenuItem,
//   Alert,
//   CircularProgress,
// } from '@mui/material';
// import { Web3Context } from '../context/Web3Context';
// import TransactionHistory from '../components/TransactionHistory';
// import { isAddress } from 'web3-utils';

// const transactionTypes = [
//   { value: 'erc20', label: 'ERC-20 Transfer' },
//   { value: 'erc721', label: 'ERC-721 Transfer' },
// ];

// export default function Dashboard() {
//   const { web3, account, forwarder, loading: web3Loading } = useContext(Web3Context);
//   const [formData, setFormData] = useState({
//     type: 'erc20',
//     tokenAddress: '',
//     recipient: '',
//     amount: '',
//     tokenId: '',
//   });
//   const [errors, setErrors] = useState({});
//   const [status, setStatus] = useState({ type: '', message: '' });
//   const [loading, setLoading] = useState(false);
//   const [gasEstimate, setGasEstimate] = useState(null);

//   const validateForm = () => {
//     const newErrors = {};

//     console.log('Validating form data:', formData);

//     if (!isAddress(formData.tokenAddress)) {
//       newErrors.tokenAddress = 'Invalid token address';
//     }
//     if (!isAddress(formData.recipient)) {
//       newErrors.recipient = 'Invalid recipient address';
//     }
//     if (formData.type === 'erc20' && (!formData.amount || formData.amount <= 0)) {
//       newErrors.amount = 'Invalid amount';
//     }
//     if (formData.type === 'erc721' && (!formData.tokenId || formData.tokenId < 0)) {
//       newErrors.tokenId = 'Invalid token ID';
//     }

//     console.log('Validation errors:', newErrors);

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const estimateGas = async () => {
//     if (!validateForm()) return;

//     try {
//       console.log('Estimating gas...');

//       // Convert amount to wei if it's an ERC20 transfer
//       const amount = formData.type === 'erc20'
//         ? web3.utils.toWei(formData.amount.toString(), 'ether')
//         : formData.tokenId;

//       console.log('Amount in wei:', amount);

//       // First, check if the token contract has approved the forwarder
//       if (formData.type === 'erc20') {
//         const tokenContract = new web3.eth.Contract(
//           [
//             {
//               "constant": true,
//               "inputs": [
//                 {
//                   "name": "owner",
//                   "type": "address"
//                 },
//                 {
//                   "name": "spender",
//                   "type": "address"
//                 }
//               ],
//               "name": "allowance",
//               "outputs": [{ "name": "", "type": "uint256" }],
//               "type": "function"
//             },
//             {
//               "constant": true,
//               "inputs": [{ "name": "account", "type": "address" }],
//               "name": "balanceOf",
//               "outputs": [{ "name": "", "type": "uint256" }],
//               "type": "function"
//             }
//           ],
//           formData.tokenAddress
//         );

//         // Check balance
//         const balance = await tokenContract.methods.balanceOf(account).call();
//         console.log('Token balance:', balance);
//         if (BigInt(balance) < (BigInt(amount))) {
//           throw new Error('Insufficient token balance');
//         }

//         // Check allowance
//         const allowance = await tokenContract.methods
//           .allowance(account, forwarder._address)
//           .call();
//         console.log('Current allowance:', allowance);

//         if (BigInt(allowance)< (BigInt(amount))) {
//           throw new Error('Please approve the Forwarder contract first');
//         }
//       }

//       // Create dummy signature for estimation
//       const dummySignature = '0x' + '00'.repeat(65);

//       console.log('Estimating gas for transfer with params:', {
//         tokenAddress: formData.tokenAddress,
//         from: account,
//         to: formData.recipient,
//         amount: amount,
//         signature: dummySignature
//       });

//       // Estimate gas for the appropriate method
//       const method = formData.type === 'erc20'
//         ? forwarder.methods.forwardERC20Transfer(
//           formData.tokenAddress,
//           account,
//           formData.recipient,
//           amount,
//           dummySignature
//         )
//         : forwarder.methods.forwardERC721Transfer(
//           formData.tokenAddress,
//           account,
//           formData.recipient,
//           formData.tokenId,
//           dummySignature
//         );

//       const gasEstimate = await method.estimateGas({
//         from: account,
//       });

//       const gasPrice = await web3.eth.getGasPrice();
//       const estimatedCost = web3.utils.fromWei(
//         (BigInt(gasEstimate) * BigInt(gasPrice)).toString(),
//         'ether'
//       );

//       setGasEstimate({
//         gas: gasEstimate,
//         cost: estimatedCost,
//       });

//       console.log('Gas estimation successful:', {
//         gasEstimate,
//         estimatedCost
//       });

//     } catch (error) {
//       console.error('Gas estimation failed:', error);
//       setStatus({
//         type: 'error',
//         message: error.message || 'Gas estimation failed. Make sure you have approved the Forwarder contract.',
//       });
//     }
//   };

//   const approveForwarder = async () => {
//     try {
//       setStatus({
//         type: 'info',
//         message: 'Approving Forwarder contract...',
//       });

//       const tokenContract = new web3.eth.Contract(
//         [
//           {
//             "constant": false,
//             "inputs": [
//               {
//                 "name": "spender",
//                 "type": "address"
//               },
//               {
//                 "name": "amount",
//                 "type": "uint256"
//               }
//             ],
//             "name": "approve",
//             "outputs": [{ "name": "", "type": "bool" }],
//             "type": "function"
//           }
//         ],
//         formData.tokenAddress
//       );

//       const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
//       console.log('Approving forwarder address:', forwarder._address);

//       const tx = await tokenContract.methods
//         .approve(forwarder._address, maxUint256)
//         .send({ from: account });

//       console.log('Approval transaction:', tx);

//       setStatus({
//         type: 'success',
//         message: 'Forwarder contract approved successfully!',
//       });
//     } catch (error) {
//       console.error('Approval failed:', error);
//       setStatus({
//         type: 'error',
//         message: 'Failed to approve Forwarder contract: ' + error.message,
//       });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       console.log('Preparing transaction with form data:', formData);

//       // Convert amount to wei if it's an ERC20 transfer
//       const amount = formData.type === 'erc20'
//         ? web3.utils.toWei(formData.amount.toString(), 'ether')
//         : formData.tokenId;

//       console.log('Amount in wei:', amount);

//       // Check token approval first
//       if (formData.type === 'erc20') {
//         const tokenContract = new web3.eth.Contract(
//           [
//             {
//               "constant": true,
//               "inputs": [
//                 { "name": "owner", "type": "address" },
//                 { "name": "spender", "type": "address" }
//               ],
//               "name": "allowance",
//               "outputs": [{ "name": "", "type": "uint256" }],
//               "type": "function"
//             },
//             {
//               "constant": true,
//               "inputs": [{ "name": "account", "type": "address" }],
//               "name": "balanceOf",
//               "outputs": [{ "name": "", "type": "uint256" }],
//               "type": "function"
//             }
//           ],
//           formData.tokenAddress
//         );

//         const balance = await tokenContract.methods.balanceOf(account).call();
//         console.log('Token balance:', balance);

//         if (BigInt(balance)< (BigInt(amount))) {
//           throw new Error('Insufficient token balance');
//         }

//         const allowance = await tokenContract.methods
//           .allowance(account, forwarder._address)
//           .call();
//         console.log('Current allowance:', allowance);

//         if (BigInt(allowance)<(BigInt(amount))) {
//           throw new Error('Please approve the Forwarder contract first');
//         }
//       }

//       // Get the nonce for the current user
//       const nonce = await forwarder.methods.getNonce(account).call();
//       console.log('Current nonce:', nonce);

//       // Create the forward request data
//       const data = formData.type === 'erc20'
//         ? web3.eth.abi.encodeFunctionCall({
//           name: 'transferFrom',
//           type: 'function',
//           inputs: [{
//             type: 'address',
//             name: 'from'
//           }, {
//             type: 'address',
//             name: 'to'
//           }, {
//             type: 'uint256',
//             name: 'amount'
//           }]
//         }, [account, formData.recipient, amount])
//         : web3.eth.abi.encodeFunctionCall({
//           name: 'transferFrom',
//           type: 'function',
//           inputs: [{
//             type: 'address',
//             name: 'from'
//           }, {
//             type: 'address',
//             name: 'to'
//           }, {
//             type: 'uint256',
//             name: 'tokenId'
//           }]
//         }, [account, formData.recipient, formData.tokenId]);

//       // Prepare the forward request
//       const forwardRequest = {
//         from: account,
//         to: formData.tokenAddress,
//         value: '0',
//         gas: '200000',
//         nonce: nonce.toString(),
//         data: data,
//         validUntil: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
//       };

//       console.log('Forward request:', forwardRequest);

//       // Create the message to sign
//       const messageHash = web3.utils.soliditySha3(
//         { t: 'address', v: forwardRequest.from },
//         { t: 'address', v: forwardRequest.to },
//         { t: 'uint256', v: forwardRequest.value },
//         { t: 'uint256', v: forwardRequest.gas },
//         { t: 'uint256', v: forwardRequest.nonce },
//         { t: 'bytes', v: forwardRequest.data },
//         { t: 'uint256', v: forwardRequest.validUntil }
//       );

//       const signatureMessage = web3.utils.soliditySha3(
//         "\x19Ethereum Signed Message:\n32",
//         messageHash
//       );

//       console.log('Message to sign:', signatureMessage);

//       // Sign the message
//       const signature = await web3.eth.personal.sign(
//         signatureMessage,
//         account,
//         '' // password is empty for MetaMask
//       );

//       console.log('Signature:', signature);

//       // Execute the forward request
//       const method = formData.type === 'erc20'
//         ? forwarder.methods.forwardERC20Transfer(
//           formData.tokenAddress,
//           account,
//           formData.recipient,
//           amount,
//           signature
//         )
//         : forwarder.methods.forwardERC721Transfer(
//           formData.tokenAddress,
//           account,
//           formData.recipient,
//           formData.tokenId,
//           signature
//         );

//       const gasEstimate = await method.estimateGas({ from: account });
//       console.log('Gas estimate:', gasEstimate);

//       const tx = await method.send({
//         from: account,
//         gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
//       });

//       console.log('Transaction successful:', tx);

//       setStatus({
//         type: 'success',
//         message: 'Transaction submitted successfully!',
//       });
//       setFormData({
//         type: 'erc20',
//         tokenAddress: '',
//         recipient: '',
//         amount: '',
//         tokenId: '',
//       });
//     } catch (error) {
//       console.error('Transaction submission failed:', error);
//       setStatus({
//         type: 'error',
//         message: error.message || 'Transaction failed. Please check the console for details.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (formData.tokenAddress && formData.recipient) {
//       console.log('Form data updated, re-estimating gas...');
//       estimateGas();
//     }
//   }, [formData]);

//   if (web3Loading) {
//     console.log('Web3 is loading...');
//     return <CircularProgress />;
//   }

//   return (
//     <Box>
//       <Typography variant="h4" gutterBottom>
//         Send Gasless Transaction
//       </Typography>
//       <Grid container spacing={3}>
//         <Grid item xs={12} md={6}>
//           <Card>
//             <CardContent>
//               <form onSubmit={handleSubmit}>
//                 <Grid container spacing={3}>
//                   <Grid item xs={12}>
//                     <TextField
//                       select
//                       fullWidth
//                       label="Transaction Type"
//                       name="type"
//                       value={formData.type}
//                       onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//                     >
//                       {transactionTypes.map((option) => (
//                         <MenuItem key={option.value} value={option.value}>
//                           {option.label}
//                         </MenuItem>
//                       ))}
//                     </TextField>
//                   </Grid>
//                   <Grid item xs={12}>
//                     <TextField
//                       fullWidth
//                       label="Token Address"
//                       name="tokenAddress"
//                       value={formData.tokenAddress}
//                       onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
//                     />
//                   </Grid>
//                   <Grid item xs={12}>
//                     <TextField
//                       fullWidth
//                       label="Recipient Address"
//                       name="recipient"
//                       value={formData.recipient}
//                       onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
//                     />
//                   </Grid>
//                   {formData.type === 'erc20' ? (
//                     <Grid item xs={12}>
//                       <TextField
//                         fullWidth
//                         label="Amount"
//                         name="amount"
//                         type="number"
//                         value={formData.amount}
//                         onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//                       />
//                     </Grid>
//                   ) : (
//                     <Grid item xs={12}>
//                       <TextField
//                         fullWidth
//                         label="Token ID"
//                         name="tokenId"
//                         type="number"
//                         value={formData.tokenId}
//                         onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
//                       />
//                     </Grid>
//                   )}
//                   {gasEstimate && (
//                     <Typography variant="body2" sx={{ mt: 2 }}>
//                       Estimated Gas: {gasEstimate.gas} (~{gasEstimate.cost} ETH)
//                     </Typography>
//                   )}
//                   <Grid item xs={12}>
//                     {formData.type === 'erc20' && (
//                       <Button
//                         variant="outlined"
//                         color="primary"
//                         onClick={approveForwarder}
//                         disabled={loading || !account}
//                         sx={{ mt: 2, mb: 2 }}
//                       >
//                         Approve Token Spending
//                       </Button>
//                     )}
//                     <Button
//                       variant="contained"
//                       color="primary"
//                       fullWidth
//                       type="submit"
//                       disabled={loading || !account}
//                       sx={{ mt: 2 }}
//                     >
//                       {loading ? <CircularProgress size={24} /> : 'Submit Transaction'}
//                     </Button>
//                   </Grid>
//                 </Grid>
//               </form>
//               {status.message && (
//                 <Alert severity={status.type} sx={{ mt: 2 }}>
//                   {status.message}
//                 </Alert>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TransactionHistory />
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }
