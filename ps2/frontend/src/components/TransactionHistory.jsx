import React, { useState, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Web3Context } from '../context/Web3Context';

export default function TransactionHistory() {
  const { forwarder, account } = useContext(Web3Context);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (forwarder && account) {
        try {
          const events = await forwarder.getPastEvents('TransactionForwarded', {
            filter: { from: account },
            fromBlock: 0,
            toBlock: 'latest'
          });

          const formattedTransactions = await Promise.all(
            events.map(async (event) => {
              const block = await web3.eth.getBlock(event.blockNumber);
              return {
                hash: event.transactionHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: event.returnValues.value,
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
              };
            })
          );

          setTransactions(formattedTransactions);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransactions();
  }, [forwarder, account]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Transaction History
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Transaction Hash</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.hash}>
              <TableCell>{tx.timestamp}</TableCell>
              <TableCell>
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tx.hash.substring(0, 10)}...
                </a>
              </TableCell>
              <TableCell>{tx.to}</TableCell>
              <TableCell>{tx.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
} 