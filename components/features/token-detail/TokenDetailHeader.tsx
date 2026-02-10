'use client';

import { useTokenDetailContext } from './TokenDetailContext';
import { formatNumber } from '@/lib/formatters';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from '@/contexts/ToastContext';
import { useUIStore } from '@/store/uiStore';

const TokenDetailHeader = function TokenDetailHeader() {
  const { tokenData, isLoading, currentPrice, priceChange24h } = useTokenDetailContext();
  const { selectedChainId } = useUIStore();
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { success } = useToastContext();

  // Debug logging
  useEffect(() => {
    console.log('[TokenDetailHeader] ========== TOKEN DATA DEBUG ==========');
    console.log('[TokenDetailHeader] Token data:', tokenData);
    console.log('[TokenDetailHeader] Is loading:', isLoading);
    if (tokenData) {
      console.log('[TokenDetailHeader] Fields:', {
        address: tokenData.address,
        symbol: tokenData.symbol,
        name: tokenData.name,
        price: tokenData.price,
        holders: tokenData.holders,
        supply: tokenData.supply,
        liquidity: tokenData.liquidity,
        marketCap: tokenData.marketCap,
        volume: tokenData.volume,
        timestamp: tokenData.timestamp
      });
    }
    console.log('[TokenDetailHeader] =====================================');
  }, [tokenData, isLoading]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.right,
      y: rect.bottom
    });
    setShowZoom(true);
  };

  // Update current time every 30 seconds for real-time age display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Calculate lifetime dynamically
  const lifetime = useMemo(() => {
    if (!tokenData?.timestamp) {
      console.log('[TokenDetailHeader] No timestamp available for lifetime calculation');
      return '0s';
    }
    
    // Timestamp from WebSocket is in milliseconds (token creation time)
    const timestampMs = tokenData.timestamp;
    const diff = Math.floor((currentTime - timestampMs) / 1000);

    console.log('[TokenDetailHeader] Lifetime calculation:', {
      timestamp: tokenData.timestamp,
      timestampDate: new Date(tokenData.timestamp).toISOString(),
      currentTime,
      currentTimeDate: new Date(currentTime).toISOString(),
      diff,
      diffMinutes: Math.floor(diff / 60),
      diffHours: Math.floor(diff / 3600),
      diffDays: Math.floor(diff / 86400)
    });

    if (diff < 0) {
      console.warn('[TokenDetailHeader] Negative time difference - timestamp is in the future!');
      return '0s';
    }

    if (diff < 60) {
      return `${diff}s`;
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days}d`;
    }
  }, [tokenData?.timestamp, currentTime]);

  // Format volume (convert from lamports to SOL and multiply by price)
  const formattedVolume = useMemo(() => {
    if (!tokenData?.volume) return '0';
    // Volume is in lamports, convert to SOL and multiply by ~85 (approximate SOL price)
    const volumeInSol = tokenData.volume / 1e9;
    const volumeInUsd = volumeInSol * 85;
    return formatNumber(volumeInUsd);
  }, [tokenData?.volume]);

  // Format market cap
  const formattedMarketCap = useMemo(() => {
    if (!tokenData?.marketCap) return '0';
    return formatNumber(tokenData.marketCap/1000000);
  }, [tokenData?.marketCap]);

  // Format price change
  const priceChangeDisplay = useMemo(() => {
    const change = priceChange24h ?? tokenData?.priceChange24h ?? 0;
    const isPositive = change >= 0;
    return {
      value: `${isPositive ? '+' : ''}${(change * 100).toFixed(2)}%`,
      color: isPositive ? 'rgb(134, 217, 159)' : 'rgb(242, 102, 130)'
    };
  }, [priceChange24h, tokenData?.priceChange24h]);

  const handleCopyAddress = async () => {
    if (!tokenData?.address) return;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tokenData.address);
        setCopySuccess(true);
        success('Address copied to clipboard!');
        setTimeout(() => setCopySuccess(false), 1000);
      } else {
        // Fallback for non-secure contexts (HTTP)
        const textArea = document.createElement('textarea');
        textArea.value = tokenData.address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopySuccess(true);
            success('Address copied to clipboard!');
            setTimeout(() => setCopySuccess(false), 1000);
          } else {
            throw new Error('execCommand failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy address:', err);
      // Show error toast
      success('Failed to copy address');
    }
  };

  if (isLoading) {
    return <TokenDetailHeaderSkeleton />;
  }

  if (!tokenData) {
    return null;
  }

  return (
    <>
      <div className="flex items-center pl-4 h-[70px] overflow-auto gap-4 border-b pr-5" style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}>
        <div className="flex flex-1 items-center gap-10 justify-start">
        {/* Left: Token Info */}
        <div className="flex items-center gap-x-2.5">
          {/* Star Icon */}
          <div className="flex">
            <div className="flex items-center justify-center cursor-pointer flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 16 16" fill="currentColor" className="transition-colors text-gray-400">
                <path d="M6.5425 1.2458c.596-1.2074 2.3182-1.2074 2.914 0l1.503 3.0469a.226.226 0 0 0 .1699.123l3.3623.4883c1.3325.1936 1.8646 1.8316.9004 2.7715l-2.4336 2.3711a.225.225 0 0 0-.0644.1992l.5742 3.3486c.2276 1.327-1.1647 2.3392-2.3565 1.7129L8.104 13.7262a.225.225 0 0 0-.209 0l-3.0078 1.5811c-1.1917.6265-2.585-.3858-2.3574-1.7129l.5752-3.3486a.226.226 0 0 0-.0654-.1992L.607 7.6755c-.9642-.9399-.4321-2.578.9004-2.7715l3.3623-.4883a.225.225 0 0 0 .169-.123zm1.6582.6191c-.0824-.1664-.3198-.1663-.4023 0l-1.504 3.0479a1.626 1.626 0 0 1-1.2236.8886l-3.3623.4883c-.184.0268-.2578.2529-.125.3828l2.4336 2.3721c.3828.3731.558.9106.4678 1.4375l-.5752 3.3496c-.0312.1833.1616.3229.3262.2363l3.0078-1.581a1.624 1.624 0 0 1 1.5117 0l3.0078 1.581c.1646.0864.3565-.0531.3252-.2363l-.5742-3.3496a1.625 1.625 0 0 1 .4678-1.4375l2.4326-2.372c.1332-.13.06-.356-.124-.3829l-3.3633-.4883a1.625 1.625 0 0 1-1.2227-.8886z"></path>
              </svg>
            </div>
          </div>

          {/* Token Image */}
          <div className="relative flex flex-col items-center justify-center">
            <div 
              className="flex flex-col items-center justify-center w-full h-full border-2 border-yellow-400 cursor-pointer" 
              style={{background: 'linear-gradient(222.08deg, rgb(247, 220, 86) -0.78%, rgb(198, 131, 0) 47.67%, rgb(247, 220, 86) 96.12%)', borderWidth: '0px', padding: '2px', borderRadius: '8px'}}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={() => setShowZoom(false)}
            >
              <div className="relative text-center flex justify-center items-center whitespace-nowrap flex-shrink-0 w-10 h-10" style={{borderRadius: '6px'}}>
                <div className="w-full h-full overflow-hidden text-center" style={{ backgroundColor: 'rgb(17, 18, 20)', lineHeight: '40px', borderRadius: '6px', borderColor: 'rgb(39, 40, 46)' }}>
                  {tokenData.image ? (
                    <img
                      src={tokenData.image}
                      alt={tokenData.symbol}
                      className="w-full h-full object-cover"
                      style={{ borderRadius: '6px' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback content
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" style="border-radius: 6px;">
                              <span class="text-white font-bold text-sm">
                                ${tokenData.symbol.slice(0, 2)}
                              </span>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" style={{borderRadius: '6px'}}>
                      <span className="text-white font-bold text-sm">
                        {tokenData.symbol.slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {showZoom && tokenData.image && createPortal(
            <div 
              className="fixed pointer-events-none"
              style={{
                left: `${position.x - 20}px`,
                top: `${position.y - 20}px`,
                zIndex: 999999
              }}
            >
              <img
                src={tokenData.image}
                alt={tokenData.symbol}
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

          {/* Token Name and Info */}
          <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-1">
              <div className="flex items-center cursor-pointer gap-x-1">
                <span className="text-white text-xl font-semibold leading-[21px] whitespace-nowrap">{tokenData.symbol}</span>
                <span className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer text-gray-400 font-normal text-base leading-4 hover:text-blue-400">{tokenData.name}</span>
              </div>
              
              {/* Action Icons */}
              <div className="relative flex items-center gap-x-1">
                <div className="flex items-center gap-x-1">
                  {/* Edit Icon */}
                  <div className="flex justify-start">
                    <div className="flex items-center cursor-pointer text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15px" height="15px" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400 hover:text-blue-400">
                        <path d="m10.2104 3.7423 1.9922 1.9922.9405-.9405c.5501-.5501.5508-1.442.0007-1.9922s-1.4428-.5501-1.9929 0zm-.5338 10.9705a.7003.7003 0 0 1-.7002-.7002.7007.7007 0 0 1 .7002-.7002l4.8082.0007a.7003.7003 0 0 1 .7002.7002.6997.6997 0 0 1-.6995.6995zm-6.5663-3.8704a.3.3 0 0 0-.0787.1381l-.6318 2.4714 2.568-.5504a.3.3 0 0 0 .1492-.0814l6.0954-6.0954-1.9922-1.9922zm7.0511-9.0301c1.0968-1.0969 2.8751-1.0969 3.9719 0s1.0969 2.875 0 3.972l-8.026 8.026a1.7 1.7 0 0 1-.846.4606l-3.3566.7188-.1216.018c-.5606.0444-1.0281-.4422-.9619-1.0006l.0228-.1209.8314-3.2524a1.7 1.7 0 0 1 .4454-.781z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center gap-x-2 text-gray-400 whitespace-nowrap text-[13px] font-normal">
              <div className="text-red-400">{lifetime}</div>
              <div 
                className="flex items-center gap-1 cursor-pointer group" 
                onClick={handleCopyAddress}
                title={copySuccess ? "Copied!" : "Click to copy address"}
              >
                <span className={`transition-colors ${copySuccess ? 'text-green-400' : 'text-gray-400 group-hover:text-white'}`}>
                  {tokenData.address.slice(0, 4)}...{tokenData.address.slice(-4)}
                </span>
                {copySuccess ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="12" 
                    height="12" 
                    viewBox="0 0 16 16" 
                    fill="currentColor"
                    className="text-green-400"
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
                    className={`transition-colors ${copySuccess ? 'text-green-400' : 'text-gray-400 group-hover:text-white'}`}
                  >
                    <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-4 pr-3">
          {/* Price */}
          <div className="text-left text-xs leading-4 whitespace-nowrap">
            <div className="text-gray-400 mb-0.5">Price</div>
            <div className="text-sm text-white leading-[18px] font-medium" style={{color: 'rgb(var(--color-text-200))'}}>
              $<PriceDisplay 
                price={selectedChainId === 501 
                  ? (((currentPrice ?? Number(tokenData?.price)) || 0) * 85).toFixed(8) 
                  : (((currentPrice ?? Number(tokenData?.price)) || 0) * 630).toFixed(5)
                } 
                chainId={selectedChainId}
                showDebug={true}
                key={currentPrice !== null ? currentPrice : tokenData.price} // Force re-render on price change
              />
            </div>
          </div>

          {/* Volume */}
          <div className="text-left text-xs leading-4 whitespace-nowrap">
            <div className="text-gray-400 mb-0.5">Volume</div>
            <div className="text-sm text-white leading-[18px] font-medium">
              ${formattedVolume}
            </div>
          </div>

          {/* Market Cap */}
          <div className="text-left text-xs leading-4 whitespace-nowrap">
            <div className="text-gray-400 mb-0.5">MC</div>
            <div className="text-sm text-white leading-[18px] font-medium">
              ${formattedMarketCap}
            </div>
          </div>

          {/* Holders */}
          <div className="text-left text-xs leading-4 whitespace-nowrap">
            <div className="text-gray-400 mb-0.5">Holders</div>
            <div className="text-sm text-white leading-[18px] font-medium">
              {formatNumber(tokenData.holders)}
            </div>
          </div>

          {/* Total Supply */}
          <div className="text-left text-xs leading-4 whitespace-nowrap">
            <div className="text-gray-400 mb-0.5">Supply</div>
            <div className="text-sm text-white leading-[18px] font-medium">
              1B
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

function TokenDetailHeaderSkeleton() {
  return (
    <div className="flex items-center pl-4 h-[70px] overflow-auto gap-4 border-b pr-5" style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}>
      <div className="flex flex-1 items-center gap-10 justify-start">
        <div className="flex items-center gap-x-2.5">
          <div className="w-3.5 h-3.5 bg-gray-700 animate-pulse" />
          <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
          <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-1">
              <div className="h-5 w-16 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-x-2">
              <div className="h-3 w-12 bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Price, 24h, Volume, MC, Liquidity, Holders, Supply */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-left">
              <div className="h-3 w-12 bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TokenDetailHeader;