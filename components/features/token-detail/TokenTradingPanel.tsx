'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useTokenDetailContext } from './TokenDetailContext';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatNumber } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useTokenPositions } from '@/hooks/useTokenPositions';

interface BuyTradeRequest {
  chain_id: number;
  token_address: string;
  amount: string;
  slippage_bps: number;
}

interface BuyTradeResponse {
  success: boolean;
  trade_id?: string;
  message?: string;
  error?: string;
}

interface SellTradeRequest {
  chain_id: number;
  token_address: string;
  amount: string;
}

interface SellTradeResponse {
  success: boolean;
  trade_id?: string;
  message?: string;
  error?: string;
}

interface TokenMetrics {
  dev: number;
  holders: number;
  last_updated: number;
  snipers: number;
  token_mint: string;
  top10: number;
}

interface PriceChanges {
  '1m': number;
  '5m': number;
  '1h': number;
  '24h': number;
}

const TokenTradingPanel = memo(function TokenTradingPanel() {
  const { tokenData } = useTokenDetailContext();
  const { getToken } = useAuthStore();
  const { selectedChainId } = useUIStore();
  const { toasts, removeToast, success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'auto'>('buy');
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedP, setSelectedP] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [isTrading, setIsTrading] = useState(false);
  
  // Get wallet balance
  const { balances, refetch: refetchBalance } = useWalletBalance();
  const balanceData = balances.find(b => b.chain_id === selectedChainId);
  const nativeBalance = balanceData?.balance || 0;
  // Get token positions to calculate token balance
  const { data: positionsData, refetch: refetchPositions } = useTokenPositions(
    selectedChainId,
    tokenData?.address || '',
    1000
  );
  
  // Calculate token balance from positions (bought - sold)
  const tokenBalance = (positionsData?.transactions || []).reduce((acc, tx) => {
    // Calculate net token balance: bought - sold
    const boughtTokens = tx.bought_amount_token / 1e6; // Normalize
    const soldTokens = tx.sold_amount_token / 1e6; // Normalize
    return acc + (boughtTokens - soldTokens);
  }, 0);
  
  console.log('[TokenTradingPanel] Balance info:', {
    nativeBalance,
    balanceData,
    tokenBalance,
    transactionsCount: positionsData?.transactions?.length || 0,
    selectedChainId
  });
  
  // Price changes state
  const [priceChanges, setPriceChanges] = useState<PriceChanges>({
    '1m': 0,
    '5m': 0,
    '1h': 0,
    '24h': 0
  });
  
  // Token metrics state
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics>({
    dev: 99.96,
    holders: 3,
    last_updated: Date.now(),
    snipers: 99.96,
    token_mint: '',
    top10: 99.96
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for token metrics
  useEffect(() => {
    console.log('[TokenTradingPanel] useEffect triggered, tokenData:', tokenData);
    
    if (!tokenData?.address) {
      console.log('[TokenTradingPanel] No token address, skipping WebSocket connection');
      return;
    }

    console.log('[TokenTradingPanel] Starting WebSocket connection for token:', tokenData.address);

    const connectWebSocket = () => {
      try {
        // Use the same WebSocket URL as other components
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.1.47:8081/ws';
        console.log('[TokenTradingPanel] Connecting to WebSocket:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('[TokenTradingPanel] WebSocket connected successfully');
          
          // Subscribe to token metrics
          const metricsSubscribeMessage = {
            action: "subscribe",
            channel: "tokenMetrics",
            data: [
              {
                tokenAddress: tokenData.address
              }
            ]
          };
          
          console.log('[TokenTradingPanel] Sending metrics subscription:', metricsSubscribeMessage);
          wsRef.current?.send(JSON.stringify(metricsSubscribeMessage));
          
          // Subscribe to token price changes
          const priceChangeSubscribeMessage = {
            action: "subscribe",
            channel: "tokenPriceChange",
            data: [
              {
                chainId: selectedChainId.toString(),
                tokenAddress: tokenData.address
              }
            ]
          };
          
          console.log('[TokenTradingPanel] Sending price change subscription:', priceChangeSubscribeMessage);
          wsRef.current?.send(JSON.stringify(priceChangeSubscribeMessage));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[TokenTradingPanel] WebSocket message received:', message);
            
            // Handle token metrics updates
            if (message.channel === 'tokenMetrics' && message.type === 'metrics' && message.data) {
              const metrics = message.data as TokenMetrics;
              console.log('[TokenTradingPanel] Updating token metrics:', metrics);
              setTokenMetrics(metrics);
            } 
            // Handle price change updates
            else if (message.channel === 'tokenPriceChange' && message.type === 'update' && message.data) {
              const { changes } = message.data;
              if (changes) {
                console.log('[TokenTradingPanel] Updating price changes:', changes);
                setPriceChanges({
                  '1m': changes['1m'] || 0,
                  '5m': changes['5m'] || 0,
                  '1h': changes['1h'] || 0,
                  '24h': changes['24h'] || 0
                });
              }
            } else {
              console.log('[TokenTradingPanel] Ignoring message:', message);
            }
          } catch (error) {
            console.error('[TokenTradingPanel] Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('[TokenTradingPanel] WebSocket disconnected:', event.code, event.reason);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[TokenTradingPanel] Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error('[TokenTradingPanel] WebSocket error:', error);
        };
      } catch (error) {
        console.error('[TokenTradingPanel] Error creating WebSocket connection:', error);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('[TokenTradingPanel] Cleaning up WebSocket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [tokenData?.address, selectedChainId]);

  const presetAmounts = activeTab === 'buy' 
    ? ['0.01', '0.1', '0.5', '1'] 
    : activeTab === 'sell' 
    ? ['25%', '50%', '75%', '100%'] 
    : ['0.01', '0.1', '0.5', '1'];

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    setSelectedPreset('');
  }, []);

  const handlePresetClick = useCallback((preset: string) => {
    if (activeTab === 'sell' && preset.endsWith('%')) {
      // Calculate percentage of token balance
      const percentage = parseInt(preset.replace('%', ''));
      const calculatedAmount = (tokenBalance * percentage / 100).toFixed(5);
      setAmount(calculatedAmount);
      setSelectedPreset(preset);
    } else {
      setAmount(preset);
      setSelectedPreset(preset);
    }
  }, [activeTab, tokenBalance]);

  const handleTrade = useCallback(async () => {
    if (!amount || !tokenData || isTrading) return;
    
    setIsTrading(true);
    
    try {
      console.log(`[TokenTradingPanel] Initiating ${activeTab} trade:`, {
        amount,
        token: tokenData.symbol,
        address: tokenData.address
      });

      if (activeTab === 'buy') {
        const buyRequest: BuyTradeRequest = {
          chain_id: selectedChainId,
          token_address: tokenData.address,
          amount: amount,
          slippage_bps: 500
        };

        console.log('[TokenTradingPanel] Sending buy request:', buyRequest);

        const token = getToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Direct call to backend (CORS now handled by backend)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.47:8080';
        const response = await fetch(`${API_BASE_URL}/api/trade/buy`, {
          method: 'POST',
          headers,
          body: JSON.stringify(buyRequest),
        });

        const result: BuyTradeResponse = await response.json();
        console.log('[TokenTradingPanel] Buy response:', result);

        // Check for success or async processing message
        if (result.success || (result.message && (
          result.message.includes('accepted') || 
          result.message.includes('processing') ||
          result.message.includes('thread')
        ))) {
          success(`Buy order submitted! ${amount} SOL`);
          setAmount('');
          setSelectedPreset('');
          
          // Refresh balance and positions after 5 seconds
          console.log('[TokenTradingPanel] Will refresh balance in 5 seconds after buy...');
          setTimeout(() => {
            console.log('[TokenTradingPanel] Refreshing balance after buy...');
            refetchPositions();
            refetchBalance();
            // Trigger refresh for all components including PositionsTab
            window.dispatchEvent(new CustomEvent('refreshBalance'));
            window.dispatchEvent(new CustomEvent('refreshPositions'));
          }, 5000);
        } else if (result.message && result.message.includes('Insufficient balance')) {
          error('Insufficient balance');
        } else {
          error(result.message || result.error || 'Buy order failed');
        }
        
      } else if (activeTab === 'sell') {
        const sellRequest: SellTradeRequest = {
          chain_id: selectedChainId,
          token_address: tokenData.address,
          amount: amount,
        };

        console.log('[TokenTradingPanel] Sending sell request:', sellRequest);

        const token = getToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Direct call to backend (CORS now handled by backend)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.47:8080';
        const response = await fetch(`${API_BASE_URL}/api/trade/sell`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sellRequest),
        });

        const result: SellTradeResponse = await response.json();
        console.log('[TokenTradingPanel] Sell response:', result);

        // Check for success or async processing message
        if (result.success || (result.message && (
          result.message.includes('accepted') || 
          result.message.includes('processing') ||
          result.message.includes('thread')
        ))) {
          success(`Sell order submitted! ${amount} ${tokenData.symbol}`);
          setAmount('');
          setSelectedPreset('');
          
          // Refresh balance and positions after 5 seconds
          console.log('[TokenTradingPanel] Will refresh balance in 5 seconds after sell...');
          setTimeout(() => {
            console.log('[TokenTradingPanel] Refreshing balance after sell...');
            refetchPositions();
            refetchBalance();
            // Trigger refresh for all components including PositionsTab
            window.dispatchEvent(new CustomEvent('refreshBalance'));
            window.dispatchEvent(new CustomEvent('refreshPositions'));
          }, 5000);
        } else {
          error(result.message || result.error || 'Sell order failed');
        }
        
      } else if (activeTab === 'auto') {
        error('Auto trading coming soon');
      }
      
    } catch (err) {
      console.error('[TokenTradingPanel] Trade error:', err);
      error('Network error: Failed to process trade');
    } finally {
      setIsTrading(false);
    }
  }, [activeTab, amount, tokenData, isTrading, getToken, success, error, selectedChainId, refetchPositions, refetchBalance]);

  if (!tokenData) {
    return (
      <div className="w-80 h-full flex items-center justify-center border-l" style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="w-80 h-full border-l flex flex-col" style={{ backgroundColor: 'rgb(17, 18, 20)', borderColor: 'rgb(39, 40, 46)' }}>
      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col w-full">
          {/* Time Performance Stats */}
          <div className="flex flex-col p-3 gap-3 border-b" style={{ borderColor: 'rgb(39, 40, 46)' }}>
            <div className="p-0.5 flex items-center flex-wrap rounded-md text-gray-400 text-xs leading-4 whitespace-nowrap gap-0.5" style={{ backgroundColor: 'rgb(31, 32, 36)' }}>
              <div className="flex flex-col justify-center cursor-pointer items-center rounded-md h-12 flex-1 transition-colors gap-0.5 hover:bg-gray-800">
                <span className="text-gray-400 font-normal">1m</span>
                <span 
                  className="font-medium" 
                  style={{ 
                    color: priceChanges['1m'] >= 0 ? 'rgb(134, 217, 159)' : 'rgb(242, 102, 130)' 
                  }}
                >
                  {priceChanges['1m'] >= 0 ? '+' : ''}{(priceChanges['1m'] / 1e6).toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col justify-center cursor-pointer items-center rounded-md h-12 flex-1 transition-colors gap-0.5 hover:bg-gray-800" style={{ backgroundColor: 'rgb(35, 37, 41)' }}>
                <span className="text-white font-semibold">5m</span>
                <span 
                  className="font-medium" 
                  style={{ 
                    color: priceChanges['5m'] >= 0 ? 'rgb(134, 217, 159)' : 'rgb(242, 102, 130)' 
                  }}
                >
                  {priceChanges['5m'] >= 0 ? '+' : ''}{(priceChanges['5m'] / 1e6).toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col justify-center cursor-pointer items-center rounded-md h-12 flex-1 transition-colors gap-0.5 hover:bg-gray-800">
                <span className="text-gray-400 font-normal">1h</span>
                <span 
                  className="font-medium" 
                  style={{ 
                    color: priceChanges['1h'] >= 0 ? 'rgb(134, 217, 159)' : 'rgb(242, 102, 130)' 
                  }}
                >
                  {priceChanges['1h'] >= 0 ? '+' : ''}{(priceChanges['1h'] / 1e6).toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col justify-center cursor-pointer items-center rounded-md h-12 flex-1 transition-colors gap-0.5 hover:bg-gray-800">
                <span className="text-gray-400 font-normal">24h</span>
                <span 
                  className="font-medium" 
                  style={{ 
                    color: priceChanges['24h'] >= 0 ? 'rgb(134, 217, 159)' : 'rgb(242, 102, 130)' 
                  }}
                >
                  {priceChanges['24h'] >= 0 ? '+' : ''}{(priceChanges['24h'] / 1e6).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Volume Stats */}
            <div className="flex items-center text-gray-400 font-normal text-xs leading-4 text-center">
              <div className="flex flex-col flex-1 text-left gap-0.5">
                <span>Vol</span>
                <span className="font-medium">
                  ${tokenData.volume ? formatNumber((tokenData.volume / 1e9) * 85) : '0'}
                </span>
              </div>
              <div className="flex flex-col flex-1 gap-0.5">
                <span>Buys</span>
                <span className="font-medium" style={{ color: 'rgb(134, 217, 159)' }}>
                  {tokenData.buyCount || 0}
                  <span className="text-gray-400">/</span>
                  <span style={{ color: 'rgb(134, 217, 159)' }}>
                    ${tokenData.buyVolume ? formatNumber(tokenData.buyVolume) : '0'}
                  </span>
                </span>
              </div>
              <div className="flex flex-col flex-1 gap-0.5">
                <span>Sells</span>
                <span className="font-medium text-red-400">
                  {tokenData.sellCount || 0}
                  <span className="text-gray-400">/</span>
                  <span className="text-red-400">
                    ${tokenData.sellVolume ? formatNumber(tokenData.sellVolume) : '0'}
                  </span>
                </span>
              </div>
              <div className="flex flex-col flex-1 text-right gap-0.5">
                <span>Net Buy</span>
                <span className="font-medium" style={{ 
                  color: (tokenData.buyVolume || 0) - (tokenData.sellVolume || 0) >= 0 
                    ? 'rgb(134, 217, 159)' 
                    : 'rgb(242, 102, 130)' 
                }}>
                  {(tokenData.buyVolume || 0) - (tokenData.sellVolume || 0) >= 0 ? '+' : ''}
                  ${formatNumber(Math.abs((tokenData.buyVolume || 0) - (tokenData.sellVolume || 0)))}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 border-b" style={{ borderColor: 'rgb(39, 40, 46)' }}>
            <div className="relative flex flex-col text-sm gap-y-3 text-gray-400">
              {/* Buy/Sell/Auto Toggle */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: 'rgb(31, 32, 36)' }}>
                  <div
                    onClick={() => setActiveTab('buy')}
                    className={`flex-1 flex items-center justify-center h-8 text-sm leading-4 rounded-md cursor-pointer gap-1 transition-colors font-medium hover:bg-gray-700 ${
                      activeTab === 'buy' ? '' : 'text-gray-400'
                    }`}
                    style={{ 
                      backgroundColor: activeTab === 'buy' ? 'rgb(35, 37, 41)' : 'transparent',
                      color: activeTab === 'buy' ? 'rgb(134, 217, 159)' : 'inherit' 
                    }}
                  >
                    Buy
                  </div>
                  <div
                    onClick={() => setActiveTab('sell')}
                    className={`flex-1 flex items-center justify-center h-8 text-sm leading-4 rounded-md cursor-pointer gap-1 transition-colors font-medium hover:bg-gray-700 ${
                      activeTab === 'sell' ? '' : 'text-gray-400'
                    }`}
                    style={{ 
                      backgroundColor: activeTab === 'sell' ? 'rgb(35, 37, 41)' : 'transparent',
                      color: activeTab === 'sell' ? '#ef5350' : 'inherit' 
                    }}
                  >
                    Sell
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-end">
                <div className="whitespace-nowrap text-sm leading-4 font-normal text-gray-400">
                  {activeTab === 'buy' 
                    ? `Bal: ${(nativeBalance / 1e9).toFixed(4)} ${selectedChainId === 501 ? 'SOL' : 'BNB'}`
                    : activeTab === 'sell'
                    ? `Bal: ${(tokenBalance).toFixed(5)} ${tokenData?.symbol || 'TOKEN'}`
                    : `Bal: ${(nativeBalance / 1e9).toFixed(4)} ${selectedChainId === 501 ? 'SOL' : 'BNB'}`
                  }
                </div>
              </div>
              {/* Amount Input */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col overflow-hidden rounded-md" style={{ backgroundColor: 'rgb(31, 32, 36)' }}>
                      <div className="flex items-center rounded-md gap-1 w-full cursor-text rounded-b-none pl-2 pr-2 h-9" style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}>
                        <span className="text-gray-400 font-normal text-xs leading-4 flex-shrink-0">Amount</span>
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm outline-none"
                          placeholder="0"
                        />
                        <span className="text-gray-400 font-normal text-xs leading-4 whitespace-nowrap flex-shrink-0 -ml-30">
                          {activeTab === 'buy' ? (selectedChainId === 501 ? 'SOL' : 'BNB') : activeTab === 'sell' ? tokenData?.symbol || 'TOKEN' : (selectedChainId === 501 ? 'SOL' : 'BNB')}
                        </span>
                      </div>
                      
                      {/* Preset Amount Buttons */}
                      <div className="flex items-center border-t" style={{ borderColor: 'rgb(39, 40, 46)' }}>
                        {presetAmounts.map((preset, index) => (
                          <span
                            key={preset}
                            onClick={() => handlePresetClick(preset)}
                            className={`text-white flex items-center transition-colors justify-center whitespace-nowrap text-ellipsis flex-1 cursor-pointer h-7 gap-1 text-sm leading-4 font-normal hover:bg-gray-700 ${
                              index > 0 ? 'border-l' : ''
                            }`}
                            style={{ 
                              backgroundColor: selectedPreset === preset ? 'rgb(35, 37, 41)' : 'rgb(31, 32, 36)',
                              borderColor: index > 0 ? 'rgb(39, 40, 46)' : 'transparent'
                            }}
                          >
                            {preset}
                          </span>
                        ))}
                        <span className="flex items-center transition-colors justify-center whitespace-nowrap text-ellipsis cursor-pointer h-7 gap-1 text-sm leading-4 font-normal hover:bg-gray-700 text-white border-l w-7" style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 16 16" fill="currentColor" className="text-white">
                            <path d="m10.2104 3.7423 1.9922 1.9922.9405-.9405c.5501-.5501.5508-1.442.0007-1.9922s-1.4428-.5501-1.9929 0zm-.5338 10.9705a.7003.7003 0 0 1-.7002-.7002.7007.7007 0 0 1 .7002-.7002l4.8082.0007a.7003.7003 0 0 1 .7002.7002.6997.6997 0 0 1-.6995.6995zm-6.5663-3.8704a.3.3 0 0 0-.0787.1381l-.6318 2.4714 2.568-.5504a.3.3 0 0 0 .1492-.0814l6.0954-6.0954-1.9922-1.9922zm7.0511-9.0301c1.0968-1.0969 2.8751-1.0969 3.9719 0s1.0969 2.875 0 3.972l-8.026 8.026a1.7 1.7 0 0 1-.846.4606l-3.3566.7188-.1216.018c-.5606.0444-1.0281-.4422-.9619-1.0006l.0228-.1209.8314-3.2524a1.7 1.7 0 0 1 .4454-.781z"></path>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Exchange Rate */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">
                        {activeTab === 'buy' 
                          ? `1 ${selectedChainId === 501 ? 'SOL' : 'BNB'} ≈ 844.7K ${tokenData?.symbol || 'tokens'}` 
                          : activeTab === 'sell'
                          ? `1 ${tokenData?.symbol || 'token'} ≈ 0.00000118 ${selectedChainId === 501 ? 'SOL' : 'BNB'}`
                          : `1 ${selectedChainId === 501 ? 'SOL' : 'BNB'} ≈ 844.7K ${tokenData?.symbol || 'tokens'}`
                        }
                      </span>
                      <div className="cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                          <path fillRule="evenodd" d="M12.5732 8.168c.2101.0002.3983.1283.46.329.0252.0823.0526.181.082.293a.053.053 0 0 0 .0205.0274c.1918.4551.6433.7754 1.168.7754.0563 0 .1117-.0056.166-.0127a.05.05 0 0 0 .0352.0039 8 8 0 0 1 .293-.0772c.2062-.0496.4142.0498.5205.2334l.4345.7539c.1046.182.0893.4088-.0537.5625a7 7 0 0 1-.209.2139.053.053 0 0 0-.0146.0488c.0004.0021.0005.0048.001.0069a1.26 1.26 0 0 0-.2471.75c.0002.2816.0931.5417.249.7519a.054.054 0 0 0 .0156.0489c.0814.079.1526.1505.211.2119.1458.1538.1646.3836.0586.5673l-.4356.754c-.1051.1812-.3094.2807-.5136.2343a8 8 0 0 1-.295-.0761.052.052 0 0 0-.0488.0127c-.0033.003-.0074.0057-.0107.0087a1.3 1.3 0 0 0-.1573-.0107c-.6409.0001-1.1698.4775-1.2529 1.0957-.0037.011-.0061.0228-.0098.0332-.0653.1824-.2417.2918-.4355.292h-.9316c-.1805-.0003-.3452-.0954-.42-.2549-.0507-.6521-.5947-1.1658-1.2597-1.166-.0495 0-.0986.0033-.1465.0088a.054.054 0 0 0-.0313-.002c-.141.0362-.2606.0642-.3584.0821-.1904.0346-.3735-.0632-.4707-.2305l-.4668-.8086c-.0978-.1699-.0897-.3795.039-.5273.0022-.0024.0039-.0054.006-.0078.3126-.2304.5174-.5996.5175-1.0176 0-.3981-.1852-.7526-.4726-.9844-.015-.0169-.0307-.0322-.044-.0479-.1253-.1477-.1318-.3545-.0351-.5224l.4658-.8086c.0981-.17.284-.268.4766-.2305l.0097.002c.156.069.3292.1083.5108.1084.6424-.0003 1.172-.481 1.2529-1.1016.0636-.197.2499-.3229.458-.3232zm-.415 2.6211c-.7144.0002-1.2937.5795-1.2939 1.2939 0 .7146.5794 1.2947 1.2939 1.2949.7148 0 1.2949-.5801 1.2949-1.2949-.0002-.7146-.5803-1.2939-1.2949-1.2939" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trade Button */}
                <button
                  onClick={handleTrade}
                  disabled={!amount || isTrading}
                  className="w-full h-9 text-black font-medium text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: isTrading 
                      ? (activeTab === 'sell' ? 'rgb(129, 60, 75)' : 'rgb(100, 150, 120)')
                      : (!amount || isTrading)
                        ? (activeTab === 'sell' ? 'rgb(129, 60, 75)' : 'rgb(134, 217, 159)')
                        : (activeTab === 'sell' ? 'rgb(242, 102, 130)' : 'rgb(134, 217, 159)')
                  }}
                  onMouseEnter={(e) => {
                    if (!isTrading && amount) {
                      e.currentTarget.style.backgroundColor = activeTab === 'sell' 
                        ? 'rgb(220, 90, 120)' 
                        : 'rgb(120, 200, 145)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isTrading) {
                      e.currentTarget.style.backgroundColor = (!amount || isTrading)
                        ? (activeTab === 'sell' ? 'rgb(129, 60, 75)' : 'rgb(134, 217, 159)')
                        : (activeTab === 'sell' ? 'rgb(242, 102, 130)' : 'rgb(134, 217, 159)');
                    }
                  }}
                >
                  <div className="flex justify-center items-center gap-x-1">
                    {isTrading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <div>Processing...</div>
                      </>
                    ) : (
                      <div>{activeTab === 'buy' ? 'Buy' : activeTab === 'sell' ? 'Sell' : 'Auto Trade'}</div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Token Stats Grid */}
          <div className="flex flex-col gap-y-3 p-3 pt-3.5 border-b" style={{ borderColor: 'rgb(39, 40, 46)' }}>
            <div className="flex flex-col text-xs leading-4 font-normal text-gray-400 gap-y-4 pt-2">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex-1">
                  <div className="text-left cursor-pointer">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-start">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Top 10</span>
                    </div>
                    <div className="inline-flex items-center gap-x-1 font-medium text-sm whitespace-pre leading-4 text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 16 16" fill="currentColor" className="text-red-400">
                        <path d="M14.4648 8c0-3.5705-2.8943-6.4648-6.4648-6.4648S1.5352 4.4295 1.5352 8 4.4295 14.4648 8 14.4648 14.4648 11.5705 14.4648 8m1.4004 0c0 4.3437-3.5215 7.8652-7.8652 7.8652S.1348 12.3437.1348 8 3.6563.1348 8 .1348 15.8652 3.6563 15.8652 8"></path>
                        <path d="M5.5112 5.5116a.7003.7003 0 0 1 .9903 0l3.9863 3.9863a.7003.7003 0 0 1-.9902.9903L5.5112 6.5018a.7003.7003 0 0 1 0-.9902"></path>
                        <path d="M10.4878 5.5116a.7003.7003 0 0 0-.9902 0L5.5112 9.4979a.7004.7004 0 0 0 0 .9903.7005.7005 0 0 0 .9903 0l3.9863-3.9864a.7003.7003 0 0 0 0-.9902"></path>
                      </svg>
                      {tokenMetrics.top10.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-center cursor-pointer flex-1">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-center">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">DEV</span>
                    </div>
                    <div className="inline-flex items-center gap-x-1 font-medium text-sm whitespace-pre leading-4 text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-red-400">
                        <path d="M.4468 5.6697c.0978-1.9233 1.6884-3.4522 3.6357-3.4522.0292 0 .0582.0022.087.003C4.9616.9375 6.3806.0798 8.0014.0798c1.621 0 3.0382.859 3.83 2.1416.0298-.0008.0597-.0029.0899-.0029 2.0099 0 3.6396 1.6297 3.6396 3.6397-.0002 1.4888-.896 2.7598-2.1728 3.3232v4.4228c0 .9391-.762 1.6999-1.7002 1.7002H4.3071c-.9389 0-1.7002-.7613-1.7002-1.7002V9.1785C1.334 8.613.442 7.3435.442 5.8572zm1.3955.1875c0 1.0097.6703 1.8634 1.5937 2.1416.3277.0989.5712.4026.5713.7676v4.8378c0 .1657.1341.2999.2998.2999h7.3809l.0605-.0059a.3004.3004 0 0 0 .2393-.294V8.7683c.0002-.366.2454-.6695.5742-.7676l.1699-.0586c.7815-.3033 1.3487-1.0298 1.4209-1.8964l.0078-.1875c0-1.1597-.8813-2.113-2.0107-2.2276l-.2285-.0117a2.2 2.2 0 0 0-.3076.0234.805.805 0 0 1-.834-.4384c-.5086-1.023-1.5622-1.7237-2.7783-1.7237-1.2166 0-2.271.701-2.7793 1.7237a.8045.8045 0 0 1-.834.4375 2.4 2.4 0 0 0-.1553-.0176l-.1504-.0059c-1.2373 0-2.24 1.0024-2.2402 2.2393"></path>
                        <path d="M3.3086 11.3997a.7.7 0 0 1 .7-.7h7.9843a.7.7 0 1 1 0 1.4H4.0086a.7.7 0 0 1-.7-.7"></path>
                      </svg>
                      {tokenMetrics.dev.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-center cursor-pointer flex-1">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-center">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Holders</span>
                    </div>
                    <div className="font-medium text-sm whitespace-pre leading-4 text-gray-200">
                      <div className="inline-flex items-center gap-1">
                        <span>{tokenMetrics.holders}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col text-sm leading-4 font-medium cursor-pointer flex-1 items-end">
                    <div className="flex items-center text-gray-400 font-normal whitespace-nowrap gap-x-0.5 border-b-[0.5px] border-solid border-transparent justify-end w-fit">
                      <span>Snipers</span>
                    </div>
                    <div className="flex items-center justify-end gap-x-1 mt-0.5 text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13px" height="13px" viewBox="0 0 17 17" fill="currentColor" className="text-red-400">
                        <path d="M13.4293 8.432c0-2.7227-2.2065-4.929-4.929-4.9291-2.7227 0-4.9291 2.2064-4.9291 4.929s2.2064 4.9291 4.929 4.9291c2.7225-.0001 4.929-2.2066 4.9291-4.929m1.4687 0c-.0001 3.5339-2.8638 6.3976-6.3978 6.3977-3.534 0-6.3987-2.8637-6.3988-6.3978S4.966 2.0331 8.5002 2.0331s6.3978 2.8647 6.3978 6.3988"></path>
                        <path d="M8.5004 9.8537c.7855 0 1.422-.6366 1.422-1.422 0-.7855-.6365-1.422-1.422-1.422s-1.422.6365-1.422 1.422.6365 1.422 1.422 1.422"></path>
                      </svg>
                      <div className="flex text-xs items-center gap-x-0.5 font-medium leading-4">{tokenMetrics.snipers.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="flex-1">
                  <div className="text-left cursor-pointer">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-start">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Insiders</span>
                    </div>
                    <div className="font-medium text-xs whitespace-pre leading-4" style={{ color: 'rgb(134, 217, 159)' }}>0%</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-center cursor-pointer flex-1">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-center">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Phishing</span>
                    </div>
                    <div className="font-medium text-xs whitespace-pre leading-4 text-red-400">100%</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-center cursor-pointer flex-1">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-center">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Bundler</span>
                    </div>
                    <div className="font-medium text-xs whitespace-pre leading-4" style={{ color: 'rgb(134, 217, 159)' }}>
                      <div className="flex items-center gap-1">0%</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col text-xs leading-4 font-medium cursor-pointer flex-1 items-end">
                    <div className="flex items-center text-gray-400 font-normal whitespace-nowrap gap-x-0.5 border-b-[0.5px] border-solid border-transparent justify-end w-fit">
                      <span>Dex Paid</span>
                    </div>
                    <div className="flex items-center justify-end gap-x-1 mt-0.5 text-gray-200">
                      <span className="flex items-center justify-end gap-0.5 text-xs">Unpaid</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Row - Security Features */}
              <div className="grid grid-cols-4 gap-4">
                <div className="flex-1">
                  <div className="text-left cursor-pointer">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-start">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">NoMint</span>
                    </div>
                    <div className="flex items-center gap-x-1 font-medium text-xs whitespace-pre leading-4" style={{ color: 'rgb(134, 217, 159)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13px" height="13px" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgb(134, 217, 159)' }}>
                        <path d="M14.4639 8c0-3.57-2.8939-6.4639-6.4639-6.4639S1.5361 4.43 1.5361 8 4.43 14.4639 8 14.4639 14.4639 11.57 14.4639 8m1.4004 0c0 4.3432-3.5211 7.8643-7.8643 7.8643S.1357 12.3432.1357 8 3.6568.1357 8 .1357 15.8643 3.6568 15.8643 8"></path>
                        <path d="M4.7627 7.5042a.7003.7003 0 0 1 .9902 0l1.9942 1.994a.7003.7003 0 0 1-.9903.9903L4.7627 8.4944a.7003.7003 0 0 1 0-.9903"></path>
                        <path d="M11.7339 5.5116a.7003.7003 0 0 0-.9902 0L6.7573 9.4979c-.2733.2734-.2738.7173-.0005.9906a.7003.7003 0 0 0 .9903 0l3.9868-3.9867a.7003.7003 0 0 0 0-.9902"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-center cursor-pointer flex-1">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-center">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">No Blacklist</span>
                    </div>
                    <div className="inline-flex items-center gap-x-1 font-medium text-xs whitespace-pre leading-4" style={{ color: 'rgb(134, 217, 159)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13px" height="13px" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgb(134, 217, 159)' }}>
                        <path d="M14.4639 8c0-3.57-2.8939-6.4639-6.4639-6.4639S1.5361 4.43 1.5361 8 4.43 14.4639 8 14.4639 14.4639 11.57 14.4639 8m1.4004 0c0 4.3432-3.5211 7.8643-7.8643 7.8643S.1357 12.3432.1357 8 3.6568.1357 8 .1357 15.8643 3.6568 15.8643 8"></path>
                        <path d="M4.7627 7.5042a.7003.7003 0 0 1 .9902 0l1.9942 1.994a.7003.7003 0 0 1-.9903.9903L4.7627 8.4944a.7003.7003 0 0 1 0-.9903"></path>
                        <path d="M11.7339 5.5116a.7003.7003 0 0 0-.9902 0L6.7573 9.4979c-.2733.2734-.2738.7173-.0005.9906a.7003.7003 0 0 0 .9903 0l3.9868-3.9867a.7003.7003 0 0 0 0-.9902"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-center cursor-pointer flex-1">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-center">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Burnt</span>
                    </div>
                    <div className="inline-flex items-center gap-x-1 font-medium text-xs whitespace-pre leading-4 text-orange-400">
                      <div>🔥 100%</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-right cursor-pointer">
                    <div className="mb-0.5 flex items-center gap-x-0.5 justify-start flex-row-reverse">
                      <span className="text-gray-400 leading-4 border-solid border-transparent border-b-[0.5px]">Rug %</span>
                    </div>
                    <div className="font-medium text-sm whitespace-pre leading-4 text-gray-200">
                      <div className="flex items-center gap-0.5 justify-end">
                        <span>0%</span>
                      </div>
                    </div>
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
});

export default TokenTradingPanel;