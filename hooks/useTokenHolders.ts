import { useState, useEffect } from 'react';
import { getTokenHolders, HoldersResponse } from '@/lib/portfolio-api';
import { useAuthStore } from '@/store/authStore';

export function useTokenHolders(chainId: number, tokenAddress: string, limit: number = 50) {
  const [data, setData] = useState<HoldersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let isMounted = true;

    async function fetchHolders() {
      if (!tokenAddress || !chainId) {
        console.log('[useTokenHolders] Missing params:', { tokenAddress, chainId });
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useTokenHolders] 🚀 Fetching holders:', { chainId, tokenAddress, limit, hasToken: !!token });
        setIsLoading(true);
        setError(null);
        const response = await getTokenHolders(chainId, tokenAddress, 0, limit, token || undefined);
        
        console.log('[useTokenHolders] ✅ Response:', response);
        console.log('[useTokenHolders] 📊 Holders count:', response.holders?.length || 0);
        
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        console.error('[useTokenHolders] ❌ Error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch holders');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHolders();

    return () => {
      isMounted = false;
    };
  }, [chainId, tokenAddress, limit, token]);

  return { data, isLoading, error };
}
