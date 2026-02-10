type MessageCallback = (data: unknown) => void;
type StatusCallback = (connected: boolean) => void;

interface Subscriber {
  id: string;
  chainId: number; // Add chainId to subscriber
  onMessage: MessageCallback;
  onStatusChange?: StatusCallback;
}

interface RawTokenData {
  c: string;      // chainId
  a: string;      // tokenAddress
  s: string;      // symbol
  n: string;      // name
  i: string;      // imageUrl
  ts: string;     // totalSupply
  d: number;      // decimals
  ct: number;     // createdAt
  m: boolean;     // migrated
  sa: string;     // soldAmount
  v: string;      // volume
  bs: string;     // bondingStatus
  l: string;      // liquidity
  h: number;      // holders
  t: number;      // transactions24h
  st: number;     // sell transactions
  bt: number;     // buy transactions
  mc: string;     // marketCap
  p: string;      // price
  p24: string;    // priceChange24h
  p7: string;     // priceChange7d
  v24: string;    // volumeChange24h
  l24: string;    // liquidityChange24h
  h24: number;    // holdersChange24h
  cat: string;    // category (NEW, NEAR_MIGRATE, MIGRATED)
}

interface WebSocketMessage {
  channel: string;
  type: 'snapshot' | 'update' | 'add' | 'remove';
  data: RawTokenData[] | RawTokenData; // Can be array or single object
  timestamp: number;
}

let socket: WebSocket | null = null;
const subscribers = new Map<string, Subscriber>();
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let isIntentionalClose = false;
let currentChainId: number = 501; // Track current chainId

const MAX_RECONNECT_DELAY = 30000;
const BASE_DELAY = 1000;
const wsUrl = process.env.NEXT_PUBLIC_TRENCHES_WS_URL || 'ws://192.168.1.47:8081/ws';

const getReconnectDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
};

const notifySubscribers = (data: unknown) => {
  subscribers.forEach(sub => {
    try {
      sub.onMessage(data);
    } catch (error) {
      console.error('[TrenchesWebSocket] Error in subscriber callback:', error);
    }
  });
};

const notifyStatusChange = (connected: boolean) => {
  subscribers.forEach(sub => {
    sub.onStatusChange?.(connected);
  });
};

const transformToken = (token: RawTokenData, timestamp: number) => {
  // Map backend category to frontend category
  let category: 'new' | 'almost_bonded' | 'migrated' = 'new';
  if (token.cat === 'NEW') {
    category = 'new';
  } else if (token.cat === 'NEAR_MIGRATE') {
    category = 'almost_bonded';
  } else if (token.cat === 'MIGRATED') {
    category = 'migrated';
  }

  // Use createdAt (ct) as the token creation timestamp (in seconds, convert to milliseconds)
  const tokenCreatedAt = token.ct ? token.ct * 1000 : timestamp;

  // Handle image URL - if it's a relative path, make it absolute or use placeholder
  let imageUrl = token.i;
  if (imageUrl && !imageUrl.startsWith('http')) {
    // If it's a relative path like "/images/token.png", use a placeholder instead
    imageUrl = `https://via.placeholder.com/70x70/333/fff?text=${encodeURIComponent(token.n || token.s || '?')}`;
  }

  return {
    chainId: token.c,
    tokenAddress: token.a,
    address: token.a,
    symbol: token.n, // Backend sends name in 'n' field (short ticker)
    name: token.s,   // Backend sends symbol in 's' field (full name)
    coinName: token.s, // Backend sends symbol in 's' field (full name)
    imageUrl: imageUrl || `https://via.placeholder.com/70x70/333/fff?text=${encodeURIComponent(token.n || token.s || '?')}`,
    avatar: imageUrl || `https://via.placeholder.com/70x70/333/fff?text=${encodeURIComponent(token.n || token.s || '?')}`,
    totalSupply: token.ts,
    decimals: token.d,
    createdAt: token.ct,
    migrated: token.m,
    soldAmount: token.sa,
    volume24h: parseFloat(token.v) || 0,
    volume: parseFloat(token.v) || 0,
    bondingStatus: token.bs,
    liquidity: token.l,
    holders: token.h,
    transactions24h: token.t,
    transactionCount: {
      buy: token.bt || 0,
      sell: token.st || 0,
    },
    marketCap: parseFloat(token.mc) || 0,
    price: parseFloat(token.p) || 0,
    priceChange24h: parseFloat(token.p24) || 0,
    priceChange7d: token.p7,
    volumeChange24h: parseFloat(token.v24) || 0,
    liquidityChange24h: token.l24,
    holdersChange24h: token.h24,
    category,
    timestamp: tokenCreatedAt, // Use token creation time, not message timestamp
    fee: '0',
    metainfo: {
      telegram: null,
      x: null,
    },
    traderCount: 0,
  };
};

const connect = (chainId: number) => {
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    console.log('[TrenchesWebSocket] Already connected or connecting');
    return;
  }

  currentChainId = chainId; // Store current chainId

  try {
    console.log('[TrenchesWebSocket] Connecting to:', wsUrl, 'with chainId:', chainId);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[TrenchesWebSocket] ✅ Connected successfully');
      reconnectAttempts = 0;
      notifyStatusChange(true);

      // Subscribe to all three categories with the specified chainId
      if (socket?.readyState === WebSocket.OPEN) {
        const subscribeMessages = [
          {
            action: 'subscribe',
            channel: 'tokens',
            data: [{ chainId: chainId.toString(), category: 'NEW' }]
          },
          {
            action: 'subscribe',
            channel: 'tokens',
            data: [{ chainId: chainId.toString(), category: 'NEAR_MIGRATE' }]
          },
          {
            action: 'subscribe',
            channel: 'tokens',
            data: [{ chainId: chainId.toString(), category: 'MIGRATED' }]
          }
        ];

        console.log('[TrenchesWebSocket] 📤 Subscribing to channels with chainId:', chainId);
        subscribeMessages.forEach(msg => {
          socket?.send(JSON.stringify(msg));
        });
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const rawData = JSON.parse(event.data);
        console.log('[TrenchesWebSocket] 📨 Raw message received:', rawData);

        // Handle ping/pong
        if (rawData.type === 'ping' || (rawData as any).type === 'ping') {
          socket?.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        const message = rawData as WebSocketMessage;

        // Check if data is array or single object
        let dataArray: RawTokenData[];
        if (Array.isArray(message.data)) {
          dataArray = message.data;
          console.log('[TrenchesWebSocket] 📦 Data is array, length:', dataArray.length);
        } else if (message.data && typeof message.data === 'object') {
          // Single object - convert to array
          dataArray = [message.data as RawTokenData];
          console.log('[TrenchesWebSocket] 📦 Data is single object, converted to array');
        } else {
          console.warn('[TrenchesWebSocket] ⚠️ Invalid data format:', message.data);
          return;
        }

        if (dataArray.length > 0) {
          const timestamp = message.timestamp || Date.now();
          const transformedData = dataArray.map((token: RawTokenData) => 
            transformToken(token, timestamp)
          );

          console.log('[TrenchesWebSocket] ✅ Notifying subscribers with', transformedData.length, 'tokens, type:', message.type);

          notifySubscribers({
            type: message.type,
            data: transformedData,
            timestamp
          });
        } else {
          console.warn('[TrenchesWebSocket] ⚠️ Empty data array');
        }
      } catch (error) {
        console.error('[TrenchesWebSocket] ❌ Error parsing message:', error);
      }
    };

    socket.onclose = () => {
      console.log('[TrenchesWebSocket] 🔌 Connection closed');
      socket = null;
      notifyStatusChange(false);

      if (!isIntentionalClose && subscribers.size > 0) {
        const delay = getReconnectDelay(reconnectAttempts);
        console.log(`[TrenchesWebSocket] 🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          connect(currentChainId); // Use stored chainId for reconnection
        }, delay);
      }
    };

    socket.onerror = (error) => {
      console.error('[TrenchesWebSocket] ❌ Connection error:', error);
      notifyStatusChange(false);
    };
  } catch (error) {
    console.error('[TrenchesWebSocket] ❌ Failed to create connection:', error);
    notifyStatusChange(false);
  }
};

export const subscribeTrenchesSocket = (
  id: string,
  chainId: number, // Add chainId parameter
  onMessage: MessageCallback,
  onStatusChange?: StatusCallback
): (() => void) => {
  console.log('[TrenchesWebSocket] 📝 Adding subscriber:', id, 'with chainId:', chainId);
  subscribers.set(id, { id, chainId, onMessage, onStatusChange });

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    isIntentionalClose = false;
    connect(chainId);
  } else if (socket.readyState === WebSocket.OPEN) {
    // Check if chainId changed - if so, reconnect
    if (currentChainId !== chainId) {
      console.log('[TrenchesWebSocket] 🔄 ChainId changed from', currentChainId, 'to', chainId, '- reconnecting');
      // Unsubscribe from old chainId
      const unsubscribeMessages = [
        {
          action: 'unsubscribe',
          channel: 'tokens',
          data: [{ chainId: currentChainId.toString(), category: 'NEW' }]
        },
        {
          action: 'unsubscribe',
          channel: 'tokens',
          data: [{ chainId: currentChainId.toString(), category: 'NEAR_MIGRATE' }]
        },
        {
          action: 'unsubscribe',
          channel: 'tokens',
          data: [{ chainId: currentChainId.toString(), category: 'MIGRATED' }]
        }
      ];
      
      unsubscribeMessages.forEach(msg => {
        socket?.send(JSON.stringify(msg));
      });

      // Subscribe to new chainId
      currentChainId = chainId;
      const subscribeMessages = [
        {
          action: 'subscribe',
          channel: 'tokens',
          data: [{ chainId: chainId.toString(), category: 'NEW' }]
        },
        {
          action: 'subscribe',
          channel: 'tokens',
          data: [{ chainId: chainId.toString(), category: 'NEAR_MIGRATE' }]
        },
        {
          action: 'subscribe',
          channel: 'tokens',
          data: [{ chainId: chainId.toString(), category: 'MIGRATED' }]
        }
      ];
      
      console.log('[TrenchesWebSocket] 📤 Subscribing to new chainId:', chainId);
      subscribeMessages.forEach(msg => {
        socket?.send(JSON.stringify(msg));
      });
    } else {
      // Already connected with same chainId, just notify
      console.log('[TrenchesWebSocket] 📤 Connection already open with same chainId');
    }
    onStatusChange?.(true);
  } else if (socket.readyState === WebSocket.CONNECTING) {
    // Connection is in progress, wait for it to open
    console.log('[TrenchesWebSocket] ⏳ Connection in progress, waiting...');
    const checkConnection = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        clearInterval(checkConnection);
        console.log('[TrenchesWebSocket] 📤 Connection opened, sending subscribe messages');
        const subscribeMessages = [
          {
            action: 'subscribe',
            channel: 'tokens',
            data: [{ chainId: chainId.toString(), category: 'NEW' }]
          },
          {
            action: 'subscribe',
            channel: 'tokens',
            data: [{ chainId: chainId.toString(), category: 'NEAR_MIGRATE' }]
          },
          {
            action: 'subscribe',
            channel: 'tokens',
            data: [{ chainId: chainId.toString(), category: 'MIGRATED' }]
          }
        ];
        
        subscribeMessages.forEach(msg => {
          socket?.send(JSON.stringify(msg));
        });
        
        onStatusChange?.(true);
      } else if (!socket || socket.readyState === WebSocket.CLOSED) {
        clearInterval(checkConnection);
        console.log('[TrenchesWebSocket] ❌ Connection failed, reconnecting...');
        isIntentionalClose = false;
        connect(chainId);
      }
    }, 100);
  }

  return () => {
    console.log('[TrenchesWebSocket] 🗑️ Removing subscriber:', id);
    subscribers.delete(id);

    if (subscribers.size === 0) {
      console.log('[TrenchesWebSocket] 🔌 No more subscribers, closing connection');
      isIntentionalClose = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (socket?.readyState === WebSocket.OPEN) {
        try {
          // Send unsubscribe for all categories with current chainId
          const unsubscribeMessages = [
            {
              action: 'unsubscribe',
              channel: 'tokens',
              data: [{ chainId: currentChainId.toString(), category: 'NEW' }]
            },
            {
              action: 'unsubscribe',
              channel: 'tokens',
              data: [{ chainId: currentChainId.toString(), category: 'NEAR_MIGRATE' }]
            },
            {
              action: 'unsubscribe',
              channel: 'tokens',
              data: [{ chainId: currentChainId.toString(), category: 'MIGRATED' }]
            }
          ];
          
          unsubscribeMessages.forEach(msg => {
            socket?.send(JSON.stringify(msg));
          });
          
          // Close connection after a short delay to ensure unsubscribe messages are sent
          setTimeout(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.close();
            }
          }, 100);
        } catch (error) {
          console.error('[TrenchesWebSocket] Error during cleanup:', error);
          socket.close();
        }
      }
      socket = null;
      reconnectAttempts = 0;
    }
  };
};

export const getTrenchesSocket = () => socket;

export const disconnectTrenchesSocket = () => {
  isIntentionalClose = true;
  subscribers.clear();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
  reconnectAttempts = 0;
};
