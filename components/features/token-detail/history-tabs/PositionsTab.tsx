import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTokenDetailContext } from '../TokenDetailContext';
import { useTokenPositions } from '@/hooks/useTokenPositions';
import { calculateBought, calculateSold, calculateTotalProfit, formatHoldingDuration } from '@/lib/formatters';
import { useToastContext } from '@/contexts/ToastContext';
import { useUIStore } from '@/store/uiStore';

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
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.right,
      y: rect.bottom
    });
    setShowZoom(true);
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!imageUrl || imageError) {
    return (
      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center">
        <span className="text-gray-400 text-xs">?</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-8 h-8 flex-shrink-0">
        <img
          src={imageUrl}
          alt={name || 'Token'}
          className="w-8 h-8 rounded-full object-cover cursor-pointer"
          onError={() => setImageError(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowZoom(false)}
        />
      </div>
      {showZoom && isMounted && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed pointer-events-none"
          style={{
            left: `${position.x - 16}px`,
            top: `${position.y - 16}px`,
            zIndex: 999999
          }}
        >
          <img
            src={imageUrl}
            alt={name || 'Token'}
            className="rounded-lg object-cover border-2 border-blue-400 shadow-2xl"
            style={{ 
              backgroundColor: 'rgb(17, 18, 20)',
              width: '350px',
              height: '350px'
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}

const PositionsTab = memo(function PositionsTab() {
  const { tokenData } = useTokenDetailContext();
  const { success } = useToastContext();
  const { selectedChainId } = useUIStore();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  const { data, isLoading, error } = useTokenPositions(
    selectedChainId,
    tokenData?.address || '',
    50
  );

  // Get current price from tokenData (updated in real-time via WebSocket)
  // Convert price string to number and multiply by 1e9 to get quote value
  const currentQuote = tokenData?.price 
    ? parseFloat(tokenData.price.toString()) * 1e6
    : 0;

  if (!tokenData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-sm">Select a token to view positions</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Error loading positions</div>
          <div className="text-gray-400 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400 text-sm">Loading positions...</div>
        </div>
      </div>
    );
  }

  const transactions = data?.transactions || [];

  if (transactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-2">No positions found</div>
          <div className="text-gray-500 text-xs">No positions for {tokenData.symbol}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col" style={{ height: '724px' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-[#111214]">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-gray-400">
          <div className="col-span-3">Token</div>
          <div className="col-span-1">Bought</div>
          <div className="col-span-1">Sold</div>
          <div className="col-span-2">RPnL</div>
          <div className="col-span-2">UPnL</div>
          <div className="col-span-1">Total Profit</div>
          <div className="col-span-2">Holding Duration</div>
        </div>
      </div>

      {/* Positions List - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="divide-y divide-gray-700">
          {transactions.map((tx) => {
            const bought = calculateBought(tx.bought_amount_native, tx.bought_amount_token, selectedChainId);
            const sold = calculateSold(tx.sold_amount_native, tx.sold_amount_token, selectedChainId);
            // Use currentQuote (real-time price * 1e6) instead of tx.quote for UPnL calculation
            const profit = calculateTotalProfit(
              tx.bought_amount_native,
              tx.bought_amount_token,
              tx.sold_amount_native,
              tx.sold_amount_token,
              currentQuote, // Real-time price for UPnL calculation
              selectedChainId
            );

            return (
              <div
                key={tx.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-800/50 transition-colors"
              >
                {/* Token Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <TokenImage metadataUrl={tx.meta_data} name={tx.name} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">{tx.symbol}</span>
                      <span className="text-gray-400 text-xs truncate">{tx.name}</span>
                    </div>
                    <div 
                      className="flex items-center gap-1 cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // Copy with fallback for non-secure contexts
                        const copyToClipboard = async (text: string) => {
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              await navigator.clipboard.writeText(text);
                            } else {
                              const textArea = document.createElement('textarea');
                              textArea.value = text;
                              textArea.style.position = 'fixed';
                              textArea.style.left = '-999999px';
                              document.body.appendChild(textArea);
                              textArea.focus();
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                            }
                            setCopiedAddress(tx.token_address);
                            success('Address copied to clipboard!');
                            setTimeout(() => setCopiedAddress(null), 1000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                            success('Failed to copy address');
                          }
                        };
                        
                        copyToClipboard(tx.token_address);
                      }}
                      title="Click to copy address"
                    >
                      <span className={`text-xs font-mono truncate transition-colors ${
                        copiedAddress === tx.token_address ? 'text-green-400' : 'text-blue-400 group-hover:text-blue-300'
                      }`}>
                        {tx.token_address.slice(0, 8)}...{tx.token_address.slice(-6)}
                      </span>
                      {copiedAddress === tx.token_address ? (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 16 16" 
                          fill="currentColor"
                          className="text-green-400 flex-shrink-0"
                        >
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      ) : (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 16 16" 
                          fill="currentColor"
                          className="text-blue-400 group-hover:text-blue-300 flex-shrink-0"
                        >
                          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bought */}
                <div className="col-span-1 flex flex-col justify-center">
                  <span className="text-white text-sm font-medium">${bought.formattedAmount}</span>
                  <span className="text-gray-400 text-xs">{bought.tokenAmount}</span>
                </div>

                {/* Sold */}
                <div className="col-span-1 flex flex-col justify-center">
                  <span className="text-white text-sm font-medium">${sold.formattedAmount}</span>
                  <span className="text-gray-400 text-xs">{sold.tokenAmount}</span>
                </div>

                {/* RPnL */}
                <div className="col-span-2 flex items-center">
                  <span className={`text-sm font-medium ${
                    profit.isRPnlPositive === null 
                      ? 'text-gray-400' 
                      : profit.isRPnlPositive 
                        ? 'text-[rgb(134,217,159)]' 
                        : 'text-[rgb(242,102,130)]'
                  }`}>
                    ${profit.formattedRPnl}
                  </span>
                </div>

                {/* UPnL */}
                <div className="col-span-2 flex items-center">
                  <span className={`text-sm font-medium ${
                    profit.isUPnlPositive === null 
                      ? 'text-gray-400' 
                      : profit.isUPnlPositive 
                        ? 'text-[rgb(134,217,159)]' 
                        : 'text-[rgb(242,102,130)]'
                  }`}>
                    ${profit.formattedUPnl}
                  </span>
                </div>

                {/* Total Profit */}
                <div className="col-span-1 flex items-center">
                  <span className={`text-sm font-medium ${
                    profit.isPositive === null 
                      ? 'text-gray-400' 
                      : profit.isPositive 
                        ? 'text-[rgb(134,217,159)]' 
                        : 'text-[rgb(242,102,130)]'
                  }`}>
                    ${profit.formattedDisplay}
                  </span>
                </div>

                {/* Holding Duration */}
                <div className="col-span-2 flex items-center">
                  <span className="text-gray-300 text-sm">
                    {formatHoldingDuration(tx.holding_duration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 border-t border-gray-700 px-4 py-2 bg-[#111214]">
        <div className="text-xs text-gray-400">
          Total positions: {data?.total || 0}
        </div>
      </div>
    </div>
    </>
  );
});

export default PositionsTab;