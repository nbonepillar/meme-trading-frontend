import { useEffect, useState } from 'react';

interface TokenDetailSnapshot {
  a: string; // address
  h: number; // holders
  i: string; // image
  l: string; // liquidity
  mc: number; // market cap
  n: string; // name
  p: string; // price
  s: string; // symbol
  ts: string; // total supply
  v: number; // volume
  ct?: number; // created_time (token creation timestamp) - if provided by backend
}

interface TokenDetailUpdate {
  h?: number; // holders
  l?: string; // liquidity
  mc?: number; // market cap
  p?: string; // price
  ts?: string; // total supply
  v?: number; // volume
}

interface WebSocketMessage {
  channel: string;
  type: 'snapshot' | 'update';
  data: TokenDetailSnapshot | TokenDetailUpdate;
  timestamp?: number; // Token creation timestamp
}

export interface TokenDetailData {
  address: string;
  holders: number;
  image: string;
  liquidity: string;
  marketCap: number;
  name: string;
  price: string;
  symbol: string;
  totalSupply: string;
  volume: number;
  timestamp?: number; // Token creation timestamp from WebSocket
}

export function useTokenDetailWebSocket(tokenAddress: string, chainId: number) {
  const [tokenDetail, setTokenDetail] = useState<TokenDetailData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;
    console.log('[useTokenDetailWebSocket] Connecting to:', WS_URL, 'for token:', tokenAddress, 'chainId:', chainId);

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('[useTokenDetailWebSocket] ✅ Connected');
          setIsConnected(true);
          setError(null);

          // Subscribe to token detail with chainId
          const subscribeMessage = {
            action: 'subscribe',
            channel: 'tokensdetail',
            data: [{ 
              chainId: chainId.toString(),
              tokenAddress 
            }]
          };
          console.log('[useTokenDetailWebSocket] 📤 Subscribing with:', {
            chainId: chainId.toString(),
            tokenAddress: tokenAddress,
            fullMessage: subscribeMessage
          });
          ws?.send(JSON.stringify(subscribeMessage));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            console.log('[useTokenDetailWebSocket] 📨 Message received:', {
              channel: message.channel,
              type: message.type,
              data: message.data,
              timestamp: message.timestamp
            });

            if (message.channel === 'tokensdetail') {
              if (message.type === 'snapshot' && message.data) {
                // Handle snapshot
                const snapshot = message.data as TokenDetailSnapshot;
                console.log('[useTokenDetailWebSocket] 📦 Snapshot data:', {
                  address: snapshot.a,
                  symbol: snapshot.s,
                  name: snapshot.n,
                  image: snapshot.i,
                  price: snapshot.p,
                  holders: snapshot.h,
                  volume: snapshot.v,
                  marketCap: snapshot.mc,
                  liquidity: snapshot.l,
                  totalSupply: snapshot.ts,
                  created_time: snapshot.ct
                });
                const detailData: TokenDetailData = {
                  address: snapshot.a,
                  holders: snapshot.h,
                  image: snapshot.i,
                  liquidity: snapshot.l,
                  marketCap: snapshot.mc,
                  name: snapshot.n,
                  price: snapshot.p,
                  symbol: snapshot.s,
                  totalSupply: snapshot.ts,
                  volume: snapshot.v,
                  // Use created_time from snapshot if available, otherwise use message timestamp
                  timestamp: snapshot.ct || message.timestamp
                };
                console.log('[useTokenDetailWebSocket] ✅ Setting token detail:', detailData);
                setTokenDetail(detailData);
              } else if (message.type === 'update' && message.data) {
                // Handle update
                const update = message.data as TokenDetailUpdate;
                console.log('[useTokenDetailWebSocket] 🔄 Update received:', update, 'timestamp:', message.timestamp);
                setTokenDetail((prev) => {
                  if (!prev) {
                    console.log('[useTokenDetailWebSocket] ⚠️ No previous data, ignoring update');
                    return prev;
                  }
                  const updated = {
                    ...prev,
                    ...(update.h !== undefined && { holders: update.h }),
                    ...(update.l !== undefined && { liquidity: update.l }),
                    ...(update.mc !== undefined && { marketCap: update.mc }),
                    ...(update.p !== undefined && { price: update.p }),
                    ...(update.ts !== undefined && { totalSupply: update.ts }),
                    ...(update.v !== undefined && { volume: update.v }),
                    // Update timestamp if provided (this is the token creation time, not update time)
                    ...(message.timestamp !== undefined && { timestamp: message.timestamp })
                  };
                  console.log('[useTokenDetailWebSocket] ✅ Updated token detail:', updated);
                  return updated;
                });
              }
            }
          } catch (err) {
            console.error('[useTokenDetailWebSocket] ❌ Error parsing message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('[useTokenDetailWebSocket] WebSocket error:', event);
          setError('WebSocket connection error');
        };

        ws.onclose = () => {
          console.log('[useTokenDetailWebSocket] Disconnected');
          setIsConnected(false);

          // Attempt to reconnect after 5 seconds
          if (!isUnmounted) {
            reconnectTimeout = setTimeout(() => {
              console.log('[useTokenDetailWebSocket] Attempting to reconnect...');
              connect();
            }, 5000);
          }
        };
      } catch (err) {
        console.error('[useTokenDetailWebSocket] Error creating WebSocket:', err);
        setError('Failed to create WebSocket connection');
      }
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [tokenAddress, chainId]);

  return { tokenDetail, isConnected, error };
}
