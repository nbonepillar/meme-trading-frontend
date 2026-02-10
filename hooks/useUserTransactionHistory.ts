import { useState, useEffect } from 'react';
import { getUserTransactionHistory, TransactionsResponse } from '@/lib/portfolio-api';
import { useAuthStore } from '@/store/authStore';

interface UseTransactionHistoryParams {
  chainId?: number;
  tokenAddress?: string;
  type?: 0 | 1;
  limit?: number;
}

export function useUserTransactionHistory(params: UseTransactionHistoryParams = {}) {
  const { chainId, tokenAddress, type, limit = 50 } = params;
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const token = useAuthStore((state) => state.token);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[useUserTransactionHistory] Refresh event received');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('refreshBalance', handleRefresh);
    return () => window.removeEventListener('refreshBalance', handleRefresh);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUserTransactionHistory(
          chainId,
          tokenAddress,
          type,
          0,
          limit,
          token || undefined
        );
        
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [chainId, tokenAddress, type, limit, token, refreshTrigger]);

  return { data, isLoading, error };
}
