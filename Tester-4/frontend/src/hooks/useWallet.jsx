import { useCallback } from 'react';
import { useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';

export function useWallet() {
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const { chain } = useNetwork();
    const { switchNetwork } = useSwitchNetwork();

    const connectWallet = useCallback(async (connector) => {
        try {
            await connect({ connector });
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    }, [connect]);

    return {
        connectWallet,
        disconnect,
        switchNetwork,
        currentChain: chain,
        connectors
    };
}
