import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Web3Context } from '../context/Web3Context';

export default function Transactions() {
  const { web3, account, forwarder } = useContext(Web3Context);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    const fetchDetailedTransactions = async () => {
      if (forwarder && account) {
        try {
          const events = await forwarder.getPastEvents('TransactionForwarded', {
            fromBlock: 0,
            toBlock: 'latest'
          });

          const detailedTxs = await Promise.all(
            events.map(async (event) => {
              const block = await web3.eth.getBlock(event.blockNumber);
              const receipt = await web3.eth.getTransactionReceipt(event.transactionHash);
              
              return {
                hash: event.transactionHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: web3.utils.fromWei(event.returnValues.value, 'ether'),
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                gasUsed: receipt.gasUsed,
                status: receipt.status ? 'Success' : 'Failed',
                blockNumber: event.blockNumber
              };
            })
          );

          setTransactions(detailedTxs);
          setFilteredTransactions(detailedTxs);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetailedTransactions();
  }, [forwarder, account, web3]);

  useEffect(() => {
    const filtered = transactions.filter(tx => 
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions]);

  const getStatusColor = (status) => {
    return status === 'Success' ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <TextField
              variant="outlined"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '100%', maxWidth: 500 }}
            />
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Transaction Hash</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Value (ETH)</TableCell>
                  <TableCell>Gas Used</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.hash}>
                    <TableCell>{tx.timestamp}</TableCell>
                    <TableCell>
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {`${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`}
                      </a>
                    </TableCell>
                    <TableCell>{`${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}`}</TableCell>
                    <TableCell>{`${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`}</TableCell>
                    <TableCell>{tx.value}</TableCell>
                    <TableCell>{tx.gasUsed}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status}
                        color={getStatusColor(tx.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}