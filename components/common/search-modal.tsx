'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTokenStore } from '@/store/tokenStore';
import { formatNumber } from '@/lib/formatters';

// Cache for metadata to avoid repeated fetches
const metadataCache = new Map<string, string>();

function useTokenMetadata(metadataUrl: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!metadataUrl) {
      setImageUrl(null);
      return;
    }

    if (metadataCache.has(metadataUrl)) {
      setImageUrl(metadataCache.get(metadataUrl)!);
      return;
    }

    setIsLoading(true);

    try {
      const parsed = JSON.parse(metadataUrl);
      if (parsed.image) {
        metadataCache.set(metadataUrl, parsed.image);
        setImageUrl(parsed.image);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      // Not a JSON string, fetch from URL
    }

    const proxyUrl = `/api/metadata?url=${encodeURIComponent(metadataUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then(text => {
        const data = JSON.parse(text);
        const image = data.image || null;
        if (image) {
          metadataCache.set(metadataUrl, image);
          setImageUrl(image);
        } else {
          setImageUrl(null);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setImageUrl(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [metadataUrl]);

  return { imageUrl, isLoading };
}

function TokenImage({ metadataUrl, name }: { metadataUrl?: string; name?: string }) {
  const { imageUrl, isLoading } = useTokenMetadata(metadataUrl);
  const [imageError, setImageError] = useState(false);

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!imageUrl || imageError) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-400 text-xs">{name?.slice(0, 2) || '?'}</span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
      <img
        src={imageUrl}
        alt={name || 'Token'}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

interface SearchResult {
  token_address: string;
  name: string;
  symbol: string;
  meta_data: string;
  volume_24h: number;
  market_cap: number;
  holders: number;
  liquidity: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [defaultTokens, setDefaultTokens] = useState<SearchResult[]>([]);
  
  // Get local tokens from Zustand store
  const newTokens = useTokenStore((state) => state.newTokensArray);
  const almostBondedTokens = useTokenStore((state) => state.almostBondedTokensArray);
  const migratedTokens = useTokenStore((state) => state.migratedTokensArray);

  // Combine all local tokens
  const localTokens = [...newTokens, ...almostBondedTokens, ...migratedTokens];
  
  // If store is empty, fetch default tokens from API
  useEffect(() => {
    if (isOpen && localTokens.length === 0 && defaultTokens.length === 0) {
      const fetchDefaultTokens = async () => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
          // Fetch popular or recent tokens as default
          const response = await fetch(`${API_BASE_URL}/api/tokens/search?keyword=`);
          const data = await response.json();
          
          if (data.status === 200 && data.results) {
            setDefaultTokens(data.results.slice(0, 20)); // Show top 20
          }
        } catch (error) {
          console.error('[SearchModal] Failed to fetch default tokens:', error);
        }
      };
      
      fetchDefaultTokens();
    }
  }, [isOpen, localTokens.length, defaultTokens.length]);

  // Search API
  const searchTokens = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${API_BASE_URL}/api/tokens/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      
      if (data.status === 200 && data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('[SearchModal] Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchTokens(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTokens]);

  const handleTokenClick = (token: any) => {
    // Navigate to token detail page with just the address
    // All data will be fetched from backend via WebSocket
    router.push(`/token/${token.tokenAddress || token.token_address}`);
    onClose();
  };

  if (!isOpen) return null;

  // Use local tokens if available, otherwise use default tokens from API
  const displayTokens = searchQuery ? searchResults : (localTokens.length > 0 ? localTokens : defaultTokens);

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-start justify-center pt-20"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl"
        style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b" style={{ borderColor: 'rgb(39, 40, 46)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search name, CA, wallet"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-10 text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : displayTokens.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              {searchQuery ? 'No results found' : 'No tokens available'}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgb(39, 40, 46)' }}>
              {displayTokens.map((token: any) => {
                const tokenAddress = token.tokenAddress || token.token_address;
                const tokenName = token.name || token.coinName || token.symbol;
                const tokenVolume = token.volume || token.volume24h || token.volume_24h || 0;
                const tokenMC = token.marketCap || token.market_cap || 0;
                
                // For search results, use meta_data (needs parsing)
                // For local tokens, use direct image URL
                const isSearchResult = !!searchQuery;
                const tokenMetadata = token.meta_data;
                const tokenImage = token.avatar || token.imageUrl || '';
                
                return (
                  <div
                    key={tokenAddress}
                    className="p-4 hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => handleTokenClick(token)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Token Image */}
                      {isSearchResult ? (
                        <TokenImage metadataUrl={tokenMetadata} name={tokenName} />
                      ) : (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                          {tokenImage ? (
                            <img
                              src={tokenImage}
                              alt={tokenName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              {token.symbol.slice(0, 2)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{token.symbol}</span>
                          <span className="text-gray-400 text-sm truncate">{tokenName}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col items-end gap-1 text-xs">
                        {tokenVolume > 0 && (
                          <div className="text-gray-400">
                            Vol: <span className="text-white">${formatNumber(tokenVolume)}</span>
                          </div>
                        )}
                        {tokenMC > 0 && (
                          <div className="text-gray-400">
                            MC: <span className="text-white">${formatNumber(tokenMC)}</span>
                          </div>
                        )}
                        {token.holders && (
                          <div className="text-gray-400">
                            Holders: <span className="text-white">{token.holders}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t text-xs text-gray-500 text-center" style={{ borderColor: 'rgb(39, 40, 46)' }}>
          Press ESC to close
        </div>
      </div>
    </div>
  );
}
