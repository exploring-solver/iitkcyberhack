import Web3 from "web3";

export const checkContractState = async (contracts, account) => {
    try {
        const { bridge, token, relayer } = contracts;
        
        // Get token balances and allowances
        const [tokenBalance, bridgeBalance, allowance, roles] = await Promise.all([
            token.methods.balanceOf(account).call(),
            token.methods.balanceOf(bridge._address).call(),
            token.methods.allowance(account, bridge._address).call(),
            verifyRoles(contracts, account)
        ]);

        const state = {
            tokenBalance,
            bridgeBalance,
            allowance,
            ...roles
        };

        const processedState = {
            tokenBalance: Web3.utils.fromWei(state.tokenBalance),
            bridgeBalance: Web3.utils.fromWei(state.bridgeBalance),
            allowance: Web3.utils.fromWei(state.allowance),
            ...roles
        };

        console.log('Contract State:', processedState);
        return state;
    } catch (error) {
        console.error('Failed to check contract state:', error);
        throw error;
    }
};

export const verifyRoles = async (contracts, account) => {
    try {
        const { bridge, token, relayer } = contracts;
        
        // Check roles
        const RELAYER_ROLE = await relayer.methods.RELAYER_ROLE().call();
        const DEFAULT_ADMIN_ROLE = await relayer.methods.DEFAULT_ADMIN_ROLE().call();
        
        const roles = {
            isAdmin: await relayer.methods.hasRole(DEFAULT_ADMIN_ROLE, account).call(),
            isRelayer: await relayer.methods.hasRole(RELAYER_ROLE, account).call(),
            bridgeHasRelayer: await relayer.methods.hasRole(RELAYER_ROLE, bridge._address).call(),
            requiredConfirmations: await relayer.methods.requiredConfirmations().call()
        };

        console.log('Role verification:', roles);
        return roles;
    } catch (error) {
        console.error('Role verification failed:', error);
        throw error;
    }
};

export const verifyContractInitialization = async (contracts) => {
    const { bridge, token, relayer } = contracts;
    
    if (!bridge || !token || !relayer) {
        throw new Error('Contracts not properly initialized');
    }

    try {
        // Verify contract code exists at addresses
        const [bridgeCode, tokenCode, relayerCode] = await Promise.all([
            window.ethereum.request({
                method: 'eth_getCode',
                params: [bridge._address, 'latest']
            }),
            window.ethereum.request({
                method: 'eth_getCode',
                params: [token._address, 'latest']
            }),
            window.ethereum.request({
                method: 'eth_getCode',
                params: [relayer._address, 'latest']
            })
        ]);

        if (bridgeCode === '0x' || tokenCode === '0x' || relayerCode === '0x') {
            throw new Error('One or more contracts not deployed');
        }

        return true;
    } catch (error) {
        console.error('Contract verification failed:', error);
        throw error;
    }
};