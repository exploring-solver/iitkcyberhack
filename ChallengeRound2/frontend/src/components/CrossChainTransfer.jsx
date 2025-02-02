import { useState } from 'react';
import { useAccount, useNetwork, useContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Box,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

const chainAGatewayABI = [
  "function lockERC20(address token, uint256 amount)",
  "function lockERC721(address token, uint256 tokenId)",
  "event Locked(address indexed token, address indexed from, uint256 amount, uint256 nonce, bool isERC721, uint256 tokenId)"
];

const chainBGatewayABI = [
  "function burn(address originalToken, uint256 amount, bool isERC721, uint256 tokenId)",
  "event Burned(address indexed originalToken, address indexed from, uint256 amount, uint256 nonce, bool isERC721, uint256 tokenId)"
];

const CHAIN_A_GATEWAY_ADDRESS = "YOUR_DEPLOYED_CHAIN_A_ADDRESS";
const CHAIN_B_GATEWAY_ADDRESS = "YOUR_DEPLOYED_CHAIN_B_ADDRESS";

export default function CrossChainTransfer() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [isERC721, setIsERC721] = useState(false);
  const [transferStatus, setTransferStatus] = useState("");

  // Contract interactions for Chain A
  const { write: lockERC20 } = useContractWrite({
    address: CHAIN_A_GATEWAY_ADDRESS,
    abi: chainAGatewayABI,
    functionName: 'lockERC20',
  });

  const { write: lockERC721 } = useContractWrite({
    address: CHAIN_A_GATEWAY_ADDRESS,
    abi: chainAGatewayABI,
    functionName: 'lockERC721',
  });

  // Contract interactions for Chain B
  const { write: burn } = useContractWrite({
    address: CHAIN_B_GATEWAY_ADDRESS,
    abi: chainBGatewayABI,
    functionName: 'burn',
  });

  // Add approval handling
  const handleApproval = async () => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        isERC721 ? ["function approve(address to, uint256 tokenId)"] : ["function approve(address spender, uint256 amount)"],
        address
      );

      setTransferStatus("Approving token...");
      
      if (isERC721) {
        await tokenContract.approve(CHAIN_A_GATEWAY_ADDRESS, tokenId);
      } else {
        await tokenContract.approve(CHAIN_A_GATEWAY_ADDRESS, ethers.parseEther(amount));
      }
      
      setTransferStatus("Approval granted. Ready to transfer.");
    } catch (error) {
      console.error("Approval failed:", error);
      setTransferStatus("Approval failed. Please try again.");
    }
  };

  // Modify handleTransfer to include approval step
  const handleTransfer = async () => {
    try {
      await handleApproval();
      setTransferStatus("Initiating transfer...");

      if (isERC721) {
        await lockERC721({
          args: [tokenAddress, BigInt(tokenId)],
        });
      } else {
        await lockERC20({
          args: [tokenAddress, ethers.parseEther(amount)],
        });
      }

      setTransferStatus("Transfer initiated! Waiting for confirmation...");
    } catch (error) {
      console.error("Transfer failed:", error);
      setTransferStatus("Transfer failed. Please try again.");
    }
  };

  const handleBurn = async () => {
    try {
      setTransferStatus("Initiating burn...");

      await burn({
        args: [tokenAddress, isERC721 ? BigInt(tokenId) : ethers.parseEther(amount), isERC721, BigInt(tokenId)],
      });

      setTransferStatus("Burn initiated! Waiting for confirmation...");
    } catch (error) {
      console.error("Burn failed:", error);
      setTransferStatus("Burn failed. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader
          title="Cross-Chain Asset Transfer"
          subheader="Transfer assets between Chain A and Chain B"
        />
        <CardContent>
          <Box className="space-y-4">
            <div>
              <Typography variant="subtitle1" className="mb-2">
                Token Type
              </Typography>
              <ToggleButtonGroup
                value={isERC721}
                exclusive
                onChange={(_, newValue) => setIsERC721(newValue)}
                aria-label="token type"
              >
                <ToggleButton value={false} aria-label="ERC20">
                  ERC20
                </ToggleButton>
                <ToggleButton value={true} aria-label="ERC721">
                  ERC721
                </ToggleButton>
              </ToggleButtonGroup>
            </div>

            <div>
              <Typography variant="subtitle1" className="mb-2">
                Token Address
              </Typography>
              <TextField
                fullWidth
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                variant="outlined"
              />
            </div>

            {isERC721 ? (
              <div>
                <Typography variant="subtitle1" className="mb-2">
                  Token ID
                </Typography>
                <TextField
                  fullWidth
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="Token ID"
                  type="number"
                  variant="outlined"
                />
              </div>
            ) : (
              <div>
                <Typography variant="subtitle1" className="mb-2">
                  Amount
                </Typography>
                <TextField
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  type="number"
                  variant="outlined"
                />
              </div>
            )}

            <Box className="flex gap-4">
              <Button
                variant="contained"
                color="primary"
                onClick={handleTransfer}
                disabled={!address || !tokenAddress || (!amount && !tokenId)}
              >
                Lock & Transfer
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleBurn}
                disabled={!address || !tokenAddress || (!amount && !tokenId)}
              >
                Burn
              </Button>
            </Box>

            {transferStatus && (
              <Alert severity="info" className="mt-4">
                <Typography variant="body2">{transferStatus}</Typography>
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}