'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTokenDetailWebSocket } from '@/hooks/useTokenDetailWebSocket';
import { useTransactionsWebSocket } from '@/hooks/useTransactionsWebSocket';
import { useTradesWebSocket } from '@/hooks/useTradesWebSocket';
import { useChartDataStore } from '@/store/chartDataStore';
import { useUIStore } from '@/store/uiStore';
import TokenDetailHeader from './TokenDetailHeader';
import TokenChart from './TokenChart';
import { TokenHistory } from './TokenHistory';
import TokenTradingPanel from './TokenTradingPanel';
import { TokenDetailProvider, TradeData, TokenData } from './TokenDetailContext';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface TokenDetailContainerProps {
  tokenAddress: string;
  initialChainId?: string;
  initialSymbol?: string;
  initialName?: string;
  initialImage?: string;
}

export default function TokenDetailContainer({ 
  tokenAddress,
  initialChainId,
  initialSymbol,
  initialName,
  initialImage
}: TokenDetailContainerProps) {
  const { selectedChainId, setSelectedChainId } = useUIStore();
  
  // Get chainId from props (from Holdings/History)
  // If not provided, use the currently selected chainId from store
  const effectiveChainId = initialChainId ? parseInt(initialChainId) : selectedChainId;
  

  // Subscribe to token detail WebSocket for real-time data
  const { tokenDetail: wsTokenDetail, isConnected: wsConnected, error: wsError } = useTokenDetailWebSocket(tokenAddress, effectiveChainId);

  // Convert WebSocket data to TokenData format
  const mergedTokenData: TokenData | null = useMemo(() => {
    if (wsTokenDetail) {
      console.log('[TokenDetailContainer] ✅ Converting WebSocket data to TokenData:', {
        address: wsTokenDetail.address,
        symbol: wsTokenDetail.symbol,
        name: wsTokenDetail.name,
        image: wsTokenDetail.image,
        price: wsTokenDetail.price,
        holders: wsTokenDetail.holders,
        volume: wsTokenDetail.volume,
        marketCap: wsTokenDetail.marketCap,
        liquidity: wsTokenDetail.liquidity,
        totalSupply: wsTokenDetail.totalSupply,
        timestamp: wsTokenDetail.timestamp
      });
      
      // Use WebSocket data as primary source
      return {
        address: wsTokenDetail.address,
        symbol: wsTokenDetail.symbol,
        name: wsTokenDetail.name,
        image: wsTokenDetail.image,
        price: wsTokenDetail.price, // Keep as string to preserve precision
        priceChange24h: 0, // Will be calculated from chart data
        liquidity: parseFloat(wsTokenDetail.liquidity),
        volume24h: wsTokenDetail.volume,
        totalFees: 0,
        supply: parseFloat(wsTokenDetail.totalSupply),
        bcurveTaxes: 0,
        marketCap: wsTokenDetail.marketCap,
        holders: wsTokenDetail.holders,
        volume: wsTokenDetail.volume,
        timestamp: wsTokenDetail.timestamp // Use timestamp from WebSocket for lifetime calculation
      };
    }
    
    // If WebSocket data not available yet, use props as fallback (from Holdings/History)
    if (initialSymbol || initialName || initialImage) {
      console.log('[TokenDetailContainer] ⏳ Using props as initial data:', {
        symbol: initialSymbol,
        name: initialName,
        image: initialImage
      });
      return {
        address: tokenAddress,
        symbol: initialSymbol || 'Loading...',
        name: initialName || 'Loading...',
        image: initialImage || '',
        price: '0',
        priceChange24h: 0,
        liquidity: 0,
        volume24h: 0,
        totalFees: 0,
        supply: 0,
        bcurveTaxes: 0,
        marketCap: 0,
        holders: 0,
        volume: 0,
        timestamp: Date.now()
      };
    }
    
    console.log('[TokenDetailContainer] ⚠️ No WebSocket data or props available yet');
    return null;
  }, [wsTokenDetail, tokenAddress, initialSymbol, initialName, initialImage]);

  console.log('[TokenDetailContainer] State:', {
    tokenAddress,
    wsConnected,
    wsError,
    hasWsData: !!wsTokenDetail,
    wsTokenDetail,
    mergedData: mergedTokenData
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [activeHistoryTab, setActiveHistoryTab] = useState('Trades');
  const [tradeHistory, setTradeHistory] = useState<TradeData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);

  // Subscribe to chart data store for real-time price updates
  const { klines } = useChartDataStore();

  // Calculate current price and 24h change from OHLCV data
  useEffect(() => {
    if (klines.length === 0) {
      console.log('[TokenDetailContainer] No klines data available');
      return;
    }

    // Sort klines by timestamp to ensure correct order
    const sortedKlines = [...klines].sort((a, b) => a.open_time - b.open_time);
    
    // Get current price from the latest candle's close price
    const latestKline = sortedKlines[sortedKlines.length - 1];
    const newCurrentPrice = latestKline.close;
    console.log('[TokenDetailContainer] Latest kline:', latestKline);
    console.log('[TokenDetailContainer] Setting new current price:', newCurrentPrice, typeof newCurrentPrice);
    console.log('[TokenDetailContainer] Price formatted:', `$${newCurrentPrice.toFixed(9)}`);
    setCurrentPrice(newCurrentPrice);

    // Calculate 24h price change if we have enough data
    if (sortedKlines.length > 1) {
      // For 24h change, we need to find a candle from ~24h ago
      // This is approximate based on available data
      const currentTime = latestKline.open_time;
      const oneDayAgo = currentTime - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
      
      // Find the closest candle to 24h ago
      let oldestRelevantKline = sortedKlines[0];
      for (const kline of sortedKlines) {
        if (kline.open_time >= oneDayAgo) {
          break;
        }
        oldestRelevantKline = kline;
      }
      
      // Calculate percentage change
      const oldPrice = oldestRelevantKline.close;
      const change = ((newCurrentPrice - oldPrice) / oldPrice) * 100;
      console.log('[TokenDetailContainer] 24h price change:', change, '%');
      setPriceChange24h(change);
    }
  }, [klines]);

  // Subscribe to transactions WebSocket (use effectiveChainId)
  useTransactionsWebSocket(tokenAddress, effectiveChainId);
  
  // Subscribe to trades WebSocket for position updates
  useTradesWebSocket(tokenAddress, 501);

  const handleTimeframeChange = useCallback((timeframe: string) => {
    setSelectedTimeframe(timeframe);
  }, []);

  const handleHistoryTabChange = useCallback((tab: string) => {
    setActiveHistoryTab(tab);
  }, []);

  const handleTradeHistoryUpdate = useCallback((trades: TradeData[] | ((prev: TradeData[]) => TradeData[])) => {
    if (typeof trades === 'function') {
      setTradeHistory(trades);
    } else {
      setTradeHistory(trades);
    }
  }, []);

  const contextValue = useMemo(() => ({
    tokenData: mergedTokenData,
    isLoading: !mergedTokenData,
    error: null,
    selectedTimeframe,
    activeHistoryTab,
    tradeHistory,
    currentPrice,
    priceChange24h,
    onTimeframeChange: handleTimeframeChange,
    onHistoryTabChange: handleHistoryTabChange,
    onTradeHistoryUpdate: handleTradeHistoryUpdate,
  }), [
    mergedTokenData,
    selectedTimeframe,
    activeHistoryTab,
    tradeHistory,
    currentPrice,
    priceChange24h,
    handleTimeframeChange,
    handleHistoryTabChange,
    handleTradeHistoryUpdate,
  ]);

  return (
    <TokenDetailProvider value={contextValue}>
      <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left side - Charts and History */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Token Header */}
            <TokenDetailHeader />
            
            {/* Chart and History - Resizable split */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <PanelGroup direction="vertical" className="flex-1">
                {/* Chart Section */}
                <Panel 
                  defaultSize={50} 
                  minSize={30} 
                  maxSize={70}
                  onResize={(size) => {
                    console.log('Chart panel resized to:', size);
                    // Trigger a custom event that the chart can listen to
                    window.dispatchEvent(new CustomEvent('chartPanelResize', { 
                      detail: { size } 
                    }));
                  }}
                >
                  <div className="h-full overflow-hidden">
                    <TokenChart />
                  </div>
                </Panel>
                
                {/* Resize Handle */}
                <PanelResizeHandle className="h-1 bg-gray-600 hover:bg-blue-500 transition-colors cursor-row-resize flex items-center justify-center group">
                  <div className="w-8 h-0.5 bg-gray-400 group-hover:bg-blue-400 transition-colors"></div>
                </PanelResizeHandle>
                
                {/* History Section */}
                <Panel 
                  defaultSize={50} 
                  minSize={30} 
                  maxSize={70}
                  onResize={(size) => {
                    console.log('History panel resized to:', size);
                  }}
                >
                  <div className="h-full overflow-hidden">
                    <TokenHistory />
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </div>
          
          {/* Right side - Trading Panel */}
          <div className="w-[320px] flex-shrink-0 border-l overflow-y-auto" style={{ borderColor: 'rgb(39, 40, 46)' }}>
            <TokenTradingPanel />
          </div>
        </div>
      </div>
    </TokenDetailProvider>
  );
}
