'use client';

import { useEffect } from 'react';
import { subscribeToTransactions, type TransactionData } from '@/lib/transactions-websocket';
import { useTransactionsStore } from '@/store/transactionsStore';

export function useTransactionsWebSocket(tokenAddress: string, chainId: number) {
  const { 
    addTransaction,
    addTransactions,
    setIsConnected, 
    setError, 
    clearTransactions
  } = useTransactionsStore();

  useEffect(() => {
    console.log('[useTransactionsWebSocket] 🚀 Subscribing to transactions:', { tokenAddress, chainId });

    const handleMessage = (data: unknown) => {
      // Handle both single transactions and bulk transactions
      if (Array.isArray(data)) {
        // Bulk snapshot data
        const transactions = data as TransactionData[];
        console.log('[useTransactionsWebSocket] 📦 Received bulk transactions:', transactions.length);
        addTransactions(transactions);
      } else {
        // Single transaction update
        const transaction = data as TransactionData;
        
        if (!transaction || !transaction.id) {
          console.warn('[useTransactionsWebSocket] Invalid transaction format:', transaction);
          return;
        }

        console.log('[useTransactionsWebSocket] 📥 New transaction:', transaction);
        addTransaction(transaction);
      }
      
      setError(null);
    };

    const handleStatusChange = (connected: boolean) => {
      console.log('[useTransactionsWebSocket] 🔌 Connection status changed:', connected ? 'CONNECTED' : 'DISCONNECTED');
      setIsConnected(connected);
      if (connected) {
        setError(null);
      } else {
        setError('Disconnected from server');
      }
    };

    const unsubscribe = subscribeToTransactions(
      `transactions-${tokenAddress}`,
      tokenAddress,
      chainId,
      handleMessage,
      handleStatusChange
    );

    return () => {
      console.log('[useTransactionsWebSocket] 🧹 Cleaning up subscription and clearing data');
      unsubscribe();
      clearTransactions();
      setIsConnected(false);
      setError(null);
    };
  }, [tokenAddress, chainId, addTransaction, addTransactions, setIsConnected, setError, clearTransactions]);
}
