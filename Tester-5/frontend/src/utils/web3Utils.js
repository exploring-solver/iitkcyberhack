export const checkNetworkStatus = async (web3) => {
    try {
        const networkId = await web3.eth.net.getId();
        const gasPrice = await web3.eth.getGasPrice();
        const block = await web3.eth.getBlock('latest');
        
        console.log('Network Status:', {
            networkId,
            gasPrice: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
            blockNumber: block.number,
            timestamp: new Date(block.timestamp * 1000).toISOString()
        });

        return true;
    } catch (error) {
        console.error('Network status check failed:', error);
        return false;
    }
};