import React, { createContext, useContext, useState } from 'react';
import Web3 from 'web3';
import DecentralizedRelayerABI from '../contracts/DecentralizedRelayer.sol/DecentralizedRelayer.json';

const RelayerContext = createContext();

export const RelayerProvider = ({ children }) => {
    const [relayers, setRelayers] = useState({
        amoy: null,
        sepolia: null
    });

    const initializeRelayer = async (web3, networkType, relayerAddress) => {
        try {
            const relayerContract = new web3.eth.Contract(
                DecentralizedRelayerABI.abi,
                relayerAddress
            );
            setRelayers(prev => ({
                ...prev,
                [networkType]: relayerContract
            }));
            return relayerContract;
        } catch (error) {
            console.error(`Error initializing ${networkType} relayer:`, error);
            throw error;
        }
    };

    const confirmTransfer = async (networkType, transferId) => {
        const relayer = relayers[networkType];
        if (!relayer) throw new Error('Relayer not initialized');

        return await relayer.methods.confirmTransfer(transferId).send({
            from: window.ethereum.selectedAddress
        });
    };

    const value = {
        relayers,
        initializeRelayer,
        confirmTransfer
    };

    return (
        <RelayerContext.Provider value={value}>
            {children}
        </RelayerContext.Provider>
    );
};

export const useRelayer = () => {
    const context = useContext(RelayerContext);
    if (!context) {
        throw new Error('useRelayer must be used within a RelayerProvider');
    }
    return context;
};