import { useState, useEffect, useRef } from 'react';

export interface TokenMetrics {
  dev: number;
  holders: number;
  last_updated: number;
  snipers: number;
  token_mint: string;
  top10: number;
}

export function useTokenMetrics(tokenAddress: string | undefined) {
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics>({
    dev: 0,
    holders: 0,
    last_updated: Date.now(),
    snipers: 0,
    token_mint: '',
    top10: 0
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      return;
    }

    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('[useTokenMetrics] WebSocket connected for token:', tokenAddress);
          setIsConnected(true);
          
          // Subscribe to token metrics
          const subscribeMessage = {
            action: "subscribe",
            channel: "tokenMetrics",
            data: [
              {
                tokenAddress: tokenAddress
              }
            ]
          };
          
          wsRef.current?.send(JSON.stringify(subscribeMessage));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.channel === 'tokenMetrics' && message.type === 'metrics' && message.data) {
              const metrics = message.data as TokenMetrics;
              setTokenMetrics(metrics);
            }
          } catch (error) {
            console.error('[useTokenMetrics] Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('[useTokenMetrics] WebSocket disconnected');
          setIsConnected(false);
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('[useTokenMetrics] WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('[useTokenMetrics] Error creating WebSocket connection:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tokenAddress]);

  return { tokenMetrics, isConnected };
}