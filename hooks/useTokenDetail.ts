import { useState, useEffect } from 'react';
import { TokenData } from '@/components/features/token-detail/TokenDetailContext';

interface UseTokenDetailOptions {
  initialImage?: string | null;
  initialSymbol?: string | null;
  initialName?: string | null;
  initialTimestamp?: string | null;
  initialVolume?: string | null;
  initialMarketCap?: string | null;
  initialPrice?: string | null;
}

export function useTokenDetail(tokenAddress: string, options?: UseTokenDetailOptions) {
  const [data, setData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Replace with actual API call to fetch token data by address
        // const response = await fetch(`/api/tokens/${tokenAddress}`);
        // const tokenData = await response.json();
        
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use URL params if provided, otherwise use mock data
        const mockTokenData: TokenData = {
          address: tokenAddress,
          symbol: options?.initialSymbol || 'MEME',
          name: options?.initialName || 'Meme Token',
          image: options?.initialImage || '/api/placeholder/32/32',
          price: options?.initialPrice ? parseFloat(options.initialPrice) : 0.00016000,
          priceChange24h: 0.05,
          liquidity: 1250000,
          volume24h: options?.initialVolume ? parseFloat(options.initialVolume) : 850000,
          volume: options?.initialVolume ? parseFloat(options.initialVolume) : 850000,
          totalFees: 12500,
          supply: 1000000000,
          bcurveTaxes: 0.05,
          marketCap: options?.initialMarketCap ? parseFloat(options.initialMarketCap) : 160000000,
          holders: 1250,
          createdAt: options?.initialTimestamp ? parseInt(options.initialTimestamp) : Math.floor((Date.now() - (2 * 60 * 60 * 1000)) / 1000),
          timestamp: options?.initialTimestamp ? parseInt(options.initialTimestamp) : Math.floor((Date.now() - (2 * 60 * 60 * 1000)) / 1000),
        };
        
        console.log('[useTokenDetail] Token data created:', {
          address: tokenAddress,
          symbol: mockTokenData.symbol,
          name: mockTokenData.name,
          image: mockTokenData.image,
          timestamp: mockTokenData.timestamp,
          volume: mockTokenData.volume,
          marketCap: mockTokenData.marketCap,
          price: mockTokenData.price,
          fromUrlParams: !!options?.initialSymbol
        });
        
        setData(mockTokenData);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenAddress) {
      fetchTokenData();
    }
  }, [tokenAddress, options?.initialImage, options?.initialSymbol, options?.initialName, options?.initialTimestamp, options?.initialVolume, options?.initialMarketCap, options?.initialPrice]);

  return { data, isLoading, error };
}