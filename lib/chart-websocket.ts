import { KlineData, useChartDataStore } from '@/store/chartDataStore';

type ChartMessageCallback = (data: KlineData) => void;
type ChartStatusCallback = (connected: boolean) => void;

interface ChartSubscriber {
  id: string;
  tokenAddress: string;
  chainId: number;
  interval: string;
  onMessage: ChartMessageCallback;
  onStatusChange?: ChartStatusCallback;
}

interface OHLCData {
  timestamp: number | string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume: number | string;
}

interface ChartWebSocketMessage {
  channel: string;
  type: 'snapshot' | 'update';
  data: {
    chainId: string;
    tokenAddress: string;
    interval: string;
    ohlc: OHLCData[] | OHLCData; // snapshot has array, update has single object
  };
  timestamp: number;
}

let chartSocket: WebSocket | null = null;
const chartSubscribers = new Map<string, ChartSubscriber>();
let chartReconnectAttempts = 0;
let chartReconnectTimer: NodeJS.Timeout | null = null;
let isChartIntentionalClose = false;

const MAX_RECONNECT_DELAY = 30000;
const BASE_DELAY = 1000;
const chartWsUrl = process.env.NEXT_PUBLIC_CHART_WS_URL || 'ws://192.168.1.47:8081/ws';

const getReconnectDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
};

const transformOHLCToKline = (ohlc: OHLCData): KlineData => {
  // Handle both string and number formats from backend
  const parseValue = (value: number | string, fieldName: string): number => {
    const originalValue = value;
    const originalType = typeof value;
    
    let result: number;
    if (typeof value === 'string') {
      // Parse string to number - backend sends prices as strings
      result = Number(value);
    } else {
      // Already a number
      result = Number(value);
    }
    
    console.log(`[ChartWebSocket] parseValue(${fieldName}):`, {
      original: originalValue,
      type: originalType,
      parsed: result,
      isValid: !isNaN(result)
    });
    
    return result;
  };

  const kline = {
    open_time: Number(ohlc.timestamp),
    open: parseValue(ohlc.open, 'open'),
    high: parseValue(ohlc.high, 'high'),
    low: parseValue(ohlc.low, 'low'),
    close: parseValue(ohlc.close, 'close'),
    volume: parseValue(ohlc.volume, 'volume')
  };
  
  console.log('[ChartWebSocket] Transformed kline:', {
    original: ohlc,
    transformed: kline,
    closeType: typeof ohlc.close,
    closeValue: ohlc.close,
    transformedClose: kline.close
  });
  
  return kline;
};

const notifyChartSubscribers = (data: KlineData, tokenAddress: string, chainId: number) => {
  chartSubscribers.forEach(sub => {
    if (sub.tokenAddress === tokenAddress && sub.chainId === chainId) {
      try {
        sub.onMessage(data);
      } catch (error) {
        console.error('[ChartWebSocket] Error in subscriber callback:', error);
      }
    }
  });
};

const notifyChartStatusChange = (connected: boolean) => {
  chartSubscribers.forEach(sub => {
    sub.onStatusChange?.(connected);
  });
};

const connectChart = () => {
  if (chartSocket && (chartSocket.readyState === WebSocket.CONNECTING || chartSocket.readyState === WebSocket.OPEN)) {
    console.log('[ChartWebSocket] Already connected or connecting');
    return;
  }

  try {
    console.log('[ChartWebSocket] Connecting to:', chartWsUrl);
    chartSocket = new WebSocket(chartWsUrl);

    chartSocket.onopen = () => {
      console.log('[ChartWebSocket] ✅ Connected successfully');
      chartReconnectAttempts = 0;
      notifyChartStatusChange(true);

      // Subscribe to all active tokens
      chartSubscribers.forEach(sub => {
        if (chartSocket?.readyState === WebSocket.OPEN) {
          const subscribeMessage = {
            action: 'subscribe',
            channel: 'tokenOHLC',
            data: [{
              chainId: sub.chainId.toString(),
              tokenAddress: sub.tokenAddress,
              interval: sub.interval
            }]
          };
          console.log('[ChartWebSocket] 📤 Subscribing:', subscribeMessage);
          chartSocket.send(JSON.stringify(subscribeMessage));
        }
      });
    };

    chartSocket.onmessage = (event: MessageEvent) => {
      try {
        const rawData = JSON.parse(event.data);

        // Handle ping/pong
        if (rawData.type === 'ping' || (rawData as any).type === 'ping') {
          chartSocket?.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        const message = rawData as ChartWebSocketMessage;

        console.log('[ChartWebSocket] 📥 Received:', {
          type: message.type,
          channel: message.channel,
          tokenAddress: message.data?.tokenAddress,
          interval: message.data?.interval,
          ohlcCount: Array.isArray(message.data?.ohlc) ? message.data.ohlc.length : 1
        });

        // Handle tokenOHLC messages
        if (message.channel === 'tokenOHLC' && message.data) {
          const { chainId, tokenAddress, interval, ohlc } = message.data;
          
          // Update chart data store
          const store = useChartDataStore.getState();
          if (store.tokenAddress === tokenAddress && store.chainId === parseInt(chainId)) {
            
            if (message.type === 'snapshot' && Array.isArray(ohlc)) {
              // Handle snapshot - replace all klines
              const klines = ohlc.map(transformOHLCToKline);
              // Sort by timestamp ascending (Lightweight Charts requirement)
              klines.sort((a, b) => a.open_time - b.open_time);
              store.setKlines(klines);
              store.setLoading(false); // Set loading to false after receiving snapshot
              
              // Notify subscribers about all klines
              klines.forEach(kline => {
                notifyChartSubscribers(kline, tokenAddress, parseInt(chainId));
              });
              
            } else if (message.type === 'update' && !Array.isArray(ohlc)) {
              // Handle update - add or update single kline
              const klineData = transformOHLCToKline(ohlc);
              
              // Check if this is an update to the last kline or a new kline
              if (store.klines.length > 0) {
                const lastKline = store.klines[store.klines.length - 1];
                if (lastKline.open_time === klineData.open_time) {
                  // Update existing kline
                  store.updateLastKline(klineData);
                } else {
                  // Add new kline
                  store.addKline(klineData);
                }
              } else {
                // First kline
                store.addKline(klineData);
              }
              
              // Notify subscribers
              notifyChartSubscribers(klineData, tokenAddress, parseInt(chainId));
            }
          }
        }
      } catch (error) {
        console.error('[ChartWebSocket] ❌ Error parsing message:', error);
      }
    };

    chartSocket.onclose = () => {
      console.log('[ChartWebSocket] 🔌 Connection closed');
      chartSocket = null;
      notifyChartStatusChange(false);

      if (!isChartIntentionalClose && chartSubscribers.size > 0) {
        const delay = getReconnectDelay(chartReconnectAttempts);
        console.log(`[ChartWebSocket] 🔄 Reconnecting in ${delay}ms (attempt ${chartReconnectAttempts + 1})`);
        chartReconnectTimer = setTimeout(() => {
          chartReconnectAttempts++;
          connectChart();
        }, delay);
      }
    };

    chartSocket.onerror = (error) => {
      console.error('[ChartWebSocket] ❌ Connection error:', error);
    };
  } catch (error) {
    console.error('[ChartWebSocket] ❌ Failed to create connection:', error);
  }
};

export const subscribeToChartData = (
  id: string,
  tokenAddress: string,
  chainId: number,
  interval: string,
  onMessage: ChartMessageCallback,
  onStatusChange?: ChartStatusCallback
): (() => void) => {
  console.log('[ChartWebSocket] Subscribing to chart data:', { id, tokenAddress, chainId, interval });
  
  // Initialize chart data store for this token
  const store = useChartDataStore.getState();
  store.setChartData({
    klines: [],
    totalCount: 0,
    period: interval,
    tokenAddress: tokenAddress,
    chainId: chainId
  });
  store.setLoading(true);
  
  chartSubscribers.set(id, { 
    id, 
    tokenAddress, 
    chainId,
    interval,
    onMessage, 
    onStatusChange 
  });

  if (!chartSocket || chartSocket.readyState === WebSocket.CLOSED) {
    isChartIntentionalClose = false;
    connectChart();
  } else if (chartSocket.readyState === WebSocket.OPEN) {
    // Subscribe to this specific token
    const subscribeMessage = {
      action: 'subscribe',
      channel: 'tokenOHLC',
      data: [{
        chainId: chainId.toString(),
        tokenAddress: tokenAddress,
        interval: interval
      }]
    };
    console.log('[ChartWebSocket] 📤 Subscribing:', subscribeMessage);
    chartSocket.send(JSON.stringify(subscribeMessage));
    onStatusChange?.(true);
  }

  return () => {
    console.log('[ChartWebSocket] 🧹 Unsubscribing from chart data:', id);
    
    const subscriber = chartSubscribers.get(id);
    if (subscriber && chartSocket?.readyState === WebSocket.OPEN) {
      // Unsubscribe from this specific token
      const unsubscribeMessage = {
        action: 'unsubscribe',
        channel: 'tokenOHLC',
        data: [{
          chainId: subscriber.chainId.toString(),
          tokenAddress: subscriber.tokenAddress,
          interval: subscriber.interval
        }]
      };
      console.log('[ChartWebSocket] 📤 Unsubscribing:', unsubscribeMessage);
      chartSocket.send(JSON.stringify(unsubscribeMessage));
    }
    
    chartSubscribers.delete(id);

    if (chartSubscribers.size === 0) {
      console.log('[ChartWebSocket] 🔌 No more subscribers, closing connection');
      isChartIntentionalClose = true;
      if (chartReconnectTimer) {
        clearTimeout(chartReconnectTimer);
        chartReconnectTimer = null;
      }
      if (chartSocket?.readyState === WebSocket.OPEN) {
        try {
          // Send proper unsubscribe message
          if (subscriber) {
            const unsubscribeMessage = {
              action: 'unsubscribe',
              channel: 'tokenOHLC',
              data: [{
                chainId: subscriber.chainId.toString(),
                tokenAddress: subscriber.tokenAddress,
                interval: subscriber.interval
              }]
            };
            console.log('[ChartWebSocket] 📤 Final unsubscribe:', unsubscribeMessage);
            chartSocket.send(JSON.stringify(unsubscribeMessage));
          }
          
          // Close connection after a short delay
          setTimeout(() => {
            if (chartSocket?.readyState === WebSocket.OPEN) {
              chartSocket.close();
            }
          }, 100);
        } catch (error) {
          console.error('[ChartWebSocket] Error during cleanup:', error);
          chartSocket.close();
        }
      }
      chartSocket = null;
      chartReconnectAttempts = 0;
    }
  };
};

export const getChartSocket = () => chartSocket;

export const disconnectChartSocket = () => {
  isChartIntentionalClose = true;
  chartSubscribers.clear();
  if (chartReconnectTimer) {
    clearTimeout(chartReconnectTimer);
    chartReconnectTimer = null;
  }
  chartSocket?.close();
  chartSocket = null;
  chartReconnectAttempts = 0;
};