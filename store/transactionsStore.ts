import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TransactionData } from '@/lib/transactions-websocket';

interface TransactionsStore {
  // Transactions array
  transactions: TransactionData[];
  
  // Connection state
  isConnected: boolean;
  error: string | null;
  
  // Actions
  addTransaction: (transaction: TransactionData) => void;
  addTransactions: (transactions: TransactionData[]) => void; // For bulk snapshot data
  clearTransactions: () => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

const MAX_TRANSACTIONS = 100;

export const useTransactionsStore = create<TransactionsStore>()(
  devtools(
    (set) => ({
      transactions: [],
      isConnected: false,
      error: null,

      addTransaction: (transaction) => set((state) => {
        // Check if transaction already exists to avoid duplicates
        const exists = state.transactions.some(tx => tx.id === transaction.id);
        if (exists) return state;
        
        // Add new transaction at the beginning
        const newTransactions = [transaction, ...state.transactions];
        // Keep only the latest 100 transactions
        return {
          transactions: newTransactions.slice(0, MAX_TRANSACTIONS)
        };
      }),

      addTransactions: (transactions) => set((state) => {
        // Filter out duplicates and sort by timestamp (newest first)
        const existingIds = new Set(state.transactions.map(tx => tx.id));
        const newTransactions = transactions
          .filter(tx => !existingIds.has(tx.id))
          .sort((a, b) => b.timestamp - a.timestamp);
        
        // Merge with existing transactions and sort
        const allTransactions = [...newTransactions, ...state.transactions]
          .sort((a, b) => b.timestamp - a.timestamp);
        
        return {
          transactions: allTransactions.slice(0, MAX_TRANSACTIONS)
        };
      }),

      clearTransactions: () => set({
        transactions: [],
      }),

      setIsConnected: (connected) => set({ isConnected: connected }),

      setError: (error) => set({ error }),
    }),
    { name: 'TransactionsStore' }
  )
);
