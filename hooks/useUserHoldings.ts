import { useState, useEffect } from 'react';
import { getUserHoldings, TransactionsResponse } from '@/lib/portfolio-api';
import { useAuthStore } from '@/store/authStore';

export function useUserHoldings(limit: number = 50) {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const token = useAuthStore((state) => state.token);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[useUserHoldings] Refresh event received');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('refreshBalance', handleRefresh);
    return () => window.removeEventListener('refreshBalance', handleRefresh);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchHoldings() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUserHoldings(0, limit, token || undefined);
        
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHoldings();

    return () => {
      isMounted = false;
    };
  }, [limit, token, refreshTrigger]);

  return { data, isLoading, error };
}
