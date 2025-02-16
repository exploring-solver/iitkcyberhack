export const checkRelayerStatus = async (relayerContract, account) => {
    try {
        const [
            relayerCount,
            requiredConfirmations,
            isRelayer
        ] = await Promise.all([
            relayerContract.methods.relayerCount().call(),
            relayerContract.methods.requiredConfirmations().call(),
            relayerContract.methods.hasRole(
                await relayerContract.methods.RELAYER_ROLE().call(),
                account
            ).call()
        ]);

        return {
            relayerCount: Number(relayerCount),
            requiredConfirmations: Number(requiredConfirmations),
            isRelayer
        };
    } catch (error) {
        console.error('Error checking relayer status:', error);
        throw error;
    }
};