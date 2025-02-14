const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL));

const sendTransaction = async (transaction) => {
    try {
        const receipt = await web3.eth.sendTransaction(transaction);
        return receipt;
    } catch (error) {
        throw new Error(`Transaction failed: ${error.message}`);
    }
};

const getTransactionReceipt = async (transactionHash) => {
    try {
        const receipt = await web3.eth.getTransactionReceipt(transactionHash);
        return receipt;
    } catch (error) {
        throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
};

const getBlockNumber = async () => {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        return blockNumber;
    } catch (error) {
        throw new Error(`Failed to get block number: ${error.message}`);
    }
};

const getAccountBalance = async (address) => {
    try {
        const balance = await web3.eth.getBalance(address);
        return web3.utils.fromWei(balance, 'ether');
    } catch (error) {
        throw new Error(`Failed to get account balance: ${error.message}`);
    }
};

module.exports = {
    sendTransaction,
    getTransactionReceipt,
    getBlockNumber,
    getAccountBalance,
};