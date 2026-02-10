'use client';

import { useUserHoldings } from '@/hooks/useUserHoldings';
import { calculateBought, calculateSold, calculateTotalProfit, formatHoldingDuration } from '@/lib/formatters';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

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
      {showZoom && createPortal(
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

export default function HoldingsContent() {
  const router = useRouter();
  const { data, isLoading, error } = useUserHoldings(50);
  const { success } = useToastContext();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Error loading holdings</div>
          <div className="text-gray-400 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400 text-sm">Loading holdings...</div>
        </div>
      </div>
    );
  }

  const transactions = data?.transactions || [];

  if (transactions.length === 0) {
    return (
      <div className="min-w-[1280px]">
        <div className="h-[calc(100vh-166px)] overflow-y-auto">
          <div className="h-full pb-2 cursor-default overflow-auto">
            <div className="w-full overflow-x-auto">
              <div className="w-full">
                <div className="bg-transparent">
                  <div className="overflow-hidden">
                    <div className="overflow-auto">
                      <table className="w-full" style={{tableLayout: 'fixed'}}>
                        <colgroup>
                          <col style={{width: '20%'}} />
                          <col style={{width: '10%'}} />
                          <col style={{width: '10%'}} />
                          <col style={{width: '15%'}} />
                          <col style={{width: '15%'}} />
                          <col style={{width: '15%'}} />
                          <col style={{width: '15%'}} />
                        </colgroup>
                        <thead className="border-b border-custom-border">
                          <tr>
                            <th className="text-left p-4 sticky left-0 bg-[#111214]">
                              <div className="flex font-medium text-xs text-second-font-color">Token</div>
                            </th>
                            <th className="text-left p-4">
                              <div className="flex font-medium text-xs text-second-font-color">Bought</div>
                            </th>
                            <th className="text-left p-4">
                              <div className="flex font-medium text-xs text-second-font-color">Sold</div>
                            </th>
                            <th className="text-left p-4">
                              <div className="flex font-medium text-xs text-second-font-color">Realized PnL</div>
                            </th>
                            <th className="text-left p-4">
                              <div className="flex font-medium text-xs text-second-font-color">Unrealized PnL</div>
                            </th>
                            <th className="text-left p-4">
                              <div className="flex font-medium text-xs text-second-font-color">Total Profit</div>
                            </th>
                            <th className="text-left p-4">
                              <div className="flex font-medium text-xs text-second-font-color">Holding Duration</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={7} className="text-center py-20">
                              <div className="flex flex-col h-fit w-full justify-center items-center gap-2">
                                <div className="text-center text-sm text-second-font-color">No Data</div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-[1280px]">
      <div className="h-[calc(100vh-166px)] overflow-y-auto">
        <div className="h-full pb-2 cursor-default overflow-auto">
          <div className="w-full overflow-x-auto">
            <div className="w-full">
              <div className="bg-transparent">
                <div className="overflow-hidden">
                  <div className="overflow-auto">
                    <table className="w-full" style={{tableLayout: 'fixed'}}>
                      <colgroup>
                        <col style={{width: '20%'}} />
                        <col style={{width: '10%'}} />
                        <col style={{width: '10%'}} />
                        <col style={{width: '15%'}} />
                        <col style={{width: '15%'}} />
                        <col style={{width: '15%'}} />
                        <col style={{width: '15%'}} />
                      </colgroup>
                      <thead className="border-b border-custom-border">
                        <tr>
                          <th className="text-left p-4 sticky left-0 bg-[#111214]">
                            <div className="flex font-medium text-xs text-second-font-color">Token</div>
                          </th>
                          <th className="text-left p-4">
                            <div className="flex font-medium text-xs text-second-font-color">Bought</div>
                          </th>
                          <th className="text-left p-4">
                            <div className="flex font-medium text-xs text-second-font-color">Sold</div>
                          </th>
                          <th className="text-left p-4">
                            <div className="flex font-medium text-xs text-second-font-color">Realized PnL</div>
                          </th>
                          <th className="text-left p-4">
                            <div className="flex font-medium text-xs text-second-font-color">Unrealized PnL</div>
                          </th>
                          <th className="text-left p-4">
                            <div className="flex font-medium text-xs text-second-font-color">Total Profit</div>
                          </th>
                          <th className="text-left p-4">
                            <div className="flex font-medium text-xs text-second-font-color">Holding Duration</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {transactions.map((tx) => {
                          const bought = calculateBought(tx.bought_amount_native, tx.bought_amount_token, tx.chain_id);
                          const sold = calculateSold(tx.sold_amount_native, tx.sold_amount_token, tx.chain_id);
                          const profit = calculateTotalProfit(
                            tx.bought_amount_native,
                            tx.bought_amount_token,
                            tx.sold_amount_native,
                            tx.sold_amount_token,
                            tx.quote,
                            tx.chain_id
                          );

                          const handleRowClick = () => {
                            // Navigate to token detail page with chain_id and basic info
                            // Basic info will be used until WebSocket data arrives
                            const params = new URLSearchParams({
                              chainId: tx.chain_id.toString(),
                              symbol: tx.symbol || '',
                              name: tx.name || '',
                              image: tx.meta_data || ''
                            });
                            console.log('[HoldingsContent] Navigating to token:', {
                              token_address: tx.token_address,
                              params: params.toString()
                            });
                            router.push(`/token/${tx.token_address}`);
                          };
                          
                          return (
                            <tr 
                              key={tx.id} 
                              className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                              onClick={handleRowClick}
                            >
                              <td className="p-4 sticky left-0 bg-[#111214]">
                                <div className="flex items-center gap-3">
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
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-white text-sm font-medium">{bought.formattedAmount}</span>
                                  <span className="text-gray-400 text-xs">{bought.formattedPrice}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-white text-sm font-medium">{sold.formattedAmount}</span>
                                  <span className="text-gray-400 text-xs">{sold.formattedPrice}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm font-medium ${
                                  profit.isRPnlPositive === null 
                                    ? 'text-gray-400' 
                                    : profit.isRPnlPositive 
                                      ? 'text-[rgb(134,217,159)]' 
                                      : 'text-[rgb(242,102,130)]'
                                }`}>
                                  ${profit.formattedRPnl}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm font-medium ${
                                  profit.isUPnlPositive === null 
                                    ? 'text-gray-400' 
                                    : profit.isUPnlPositive 
                                      ? 'text-[rgb(134,217,159)]' 
                                      : 'text-[rgb(242,102,130)]'
                                }`}>
                                  ${profit.formattedUPnl}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-sm font-medium ${
                                  profit.isPositive === null 
                                    ? 'text-gray-400' 
                                    : profit.isPositive 
                                      ? 'text-[rgb(134,217,159)]' 
                                      : 'text-[rgb(242,102,130)]'
                                }`}>
                                  ${profit.formattedDisplay}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-gray-300 text-sm">
                                  {formatHoldingDuration(tx.holding_duration)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
