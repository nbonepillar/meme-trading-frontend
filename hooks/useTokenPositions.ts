import { useState, useEffect } from 'react';
import { getTokenPositions, TransactionsResponse } from '@/lib/portfolio-api';
import { useAuthStore } from '@/store/authStore';

export function useTokenPositions(chainId: number, tokenAddress: string, limit: number = 50) {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const token = useAuthStore((state) => state.token);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[useTokenPositions] Refresh event received');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('refreshPositions', handleRefresh);
    return () => window.removeEventListener('refreshPositions', handleRefresh);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchPositions() {
      if (!tokenAddress || !chainId) {
        console.log('[useTokenPositions] Missing params:', { tokenAddress, chainId });
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useTokenPositions] 🚀 Fetching positions:', { chainId, tokenAddress, limit, hasToken: !!token });
        setIsLoading(true);
        setError(null);
        const response = await getTokenPositions(chainId, tokenAddress, 0, limit, token || undefined);
        
        console.log('[useTokenPositions] ✅ Response:', response);
        console.log('[useTokenPositions] 📊 Transactions count:', response.transactions?.length || 0);
        
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        console.error('[useTokenPositions] ❌ Error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch positions');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPositions();

    return () => {
      isMounted = false;
    };
  }, [chainId, tokenAddress, limit, token, refreshTrigger]);

  return { 
    data, 
    isLoading, 
    error,
    refetch: () => {
      console.log('[useTokenPositions] Manual refetch triggered');
      setRefreshTrigger(prev => prev + 1);
    }
  };
}
