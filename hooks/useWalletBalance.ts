'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface WalletBalance {
  chain_id: number;
  chain_name: string;
  balance: number; // Raw balance in smallest unit (lamports, wei, etc.)
  formattedBalance: number; // Converted balance (SOL, ETH, BNB)
  symbol: string;
  decimals: number;
}

interface UseWalletBalanceReturn {
  balances: WalletBalance[];
  totalUsdValue: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Chain configurations
const CHAIN_CONFIG: Record<number, { symbol: string; decimals: number }> = {
  0: { symbol: 'BNB', decimals: 18 }, // BSC
  1: { symbol: 'ETH', decimals: 18 }, // Ethereum
  501: { symbol: 'SOL', decimals: 9 }, // Solana
};

export function useWalletBalance(): UseWalletBalanceReturn {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getToken, isAuthenticated } = useAuthStore();

  const fetchBalances = useCallback(async () => {
    const token = getToken();
    console.log('[useWalletBalance] 🚀 fetchBalances called', { hasToken: !!token, isAuthenticated });
    
    if (!token || !isAuthenticated) {
      console.log('[useWalletBalance] ⚠️ No token or not authenticated, skipping fetch');
      setBalances([]);
      setTotalUsdValue(0);
      setError(null);
      return;
    }

    console.log('[useWalletBalance] ⏳ Setting isLoading = true');
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useWalletBalance] 📡 Fetching balances from API...');
      
      // Direct call to backend (CORS now handled by backend)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('[useWalletBalance] 📦 API response received:', data);

      if (response.ok && data.status === 0) {
        const formattedBalances: WalletBalance[] = data.data.balances.map((balance: any) => {
          const config = CHAIN_CONFIG[balance.chain_id];
          const decimals = config?.decimals || 18;
          const symbol = config?.symbol || balance.chain_name;
          
          return {
            chain_id: balance.chain_id,
            chain_name: balance.chain_name,
            balance: balance.balance,
            formattedBalance: balance.balance / Math.pow(10, decimals),
            symbol,
            decimals,
          };
        });

        console.log('[useWalletBalance] ✅ Formatted balances:', formattedBalances);
        console.log('[useWalletBalance] 💾 Updating state with new balances');
        setBalances(formattedBalances);
        
        // Calculate total USD value (mock calculation for now)
        // TODO: Implement real price fetching
        const mockPrices = { SOL: 100, ETH: 2500, BNB: 300 };
        const totalUsd = formattedBalances.reduce((total, balance) => {
          const price = mockPrices[balance.symbol as keyof typeof mockPrices] || 0;
          return total + (balance.formattedBalance * price);
        }, 0);
        
        console.log('[useWalletBalance] 💰 Total USD value:', totalUsd);
        setTotalUsdValue(totalUsd);
      } else {
        console.error('[useWalletBalance] ❌ API error:', data.message);
        setError(data.message || 'Failed to fetch balances');
      }
    } catch (err) {
      console.error('[useWalletBalance] ❌ Error:', err);
      setError('Failed to fetch balances');
    } finally {
      console.log('[useWalletBalance] ⏹️ Setting isLoading = false');
      setIsLoading(false);
    }
  }, [getToken, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('[useWalletBalance] User authenticated, fetching balances');
      fetchBalances();
    } else {
      console.log('[useWalletBalance] User not authenticated, clearing balances');
      setBalances([]);
      setTotalUsdValue(0);
    }
  }, [isAuthenticated, fetchBalances]);

  // Listen for global balance refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[useWalletBalance] 🎯 Refresh event RECEIVED!');
      console.log('[useWalletBalance] Current state:', { isAuthenticated, hasBalances: balances.length > 0 });
      console.log('[useWalletBalance] 🔄 Calling fetchBalances...');
      fetchBalances();
    };

    console.log('[useWalletBalance] 📝 Registering event listener for refreshBalance');
    window.addEventListener('refreshBalance', handleRefresh);
    
    return () => {
      console.log('[useWalletBalance] 🗑️ Removing event listener for refreshBalance');
      window.removeEventListener('refreshBalance', handleRefresh);
    };
  }, [fetchBalances]);

  return {
    balances,
    totalUsdValue,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}