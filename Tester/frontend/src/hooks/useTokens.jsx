import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useBalance } from 'wagmi';
import { erc20ABI } from 'wagmi';

export function useTokens(address, tokenAddress) {
    const [balance, setBalance] = useState('0');
    const [tokenList, setTokenList] = useState(() => {
        const saved = localStorage.getItem('tokenList');
        return saved ? JSON.parse(saved) : [];
    });

    const { data: tokenBalance } = useBalance({
        address,
        token: tokenAddress,
        watch: true,
    });

    useEffect(() => {
        if (tokenBalance) {
            setBalance(tokenBalance.formatted);
        }
    }, [tokenBalance]);

    const addToken = (tokenAddress, symbol) => {
        const newList = [...tokenList, { address: tokenAddress, symbol }];
        setTokenList(newList);
        localStorage.setItem('tokenList', JSON.stringify(newList));
    };

    return {
        balance,
        tokenList,
        addToken
    };
}