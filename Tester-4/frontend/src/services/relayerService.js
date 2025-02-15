const RELAYER_API = import.meta.env.VITE_RELAYER_API || 'http://localhost:3001/api';

export const relayerService = {
    async requestBridgeTransfer(transferData) {
        try {
            console.log('Requesting bridge transfer:', transferData);

            const response = await fetch(`${RELAYER_API}/bridge/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceChain: transferData.sourceChain,
                    targetChain: transferData.targetChain,
                    userAddress: transferData.userAddress,
                    amount: transferData.amount.toString(),
                    transferId: transferData.transferId,
                    receiverAddress: transferData.receiverAddress
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit bridge request');
            }

            const result = await response.json();
            console.log('Bridge transfer response:', result);

            return result;
        } catch (error) {
            console.error('Relayer service error:', error);
            throw error;
        }
    },

    async getTransferStatus(transferId) {
        try {
            const response = await fetch(`${RELAYER_API}/bridge/status/${transferId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch transfer status');
            }
            const result = await response.json();
            console.log('Transfer status:', result);
            return result;
        } catch (error) {
            console.error('Error fetching transfer status:', error);
            throw error;
        }
    }
};