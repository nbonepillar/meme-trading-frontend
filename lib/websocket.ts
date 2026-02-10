type MessageCallback = (data: unknown) => void;
type StatusCallback = (connected: boolean) => void;

interface Subscriber {
  id: string;
  onMessage: MessageCallback;
  onStatusChange?: StatusCallback;
}

interface RawTokenData {
  c: string;
  a: string;
  s: string;
  n: string;
  i: string;
  ts: string;
  d: number;
  ct: number;
  m: boolean;
  sa: string;
  v: string;
  bs: string;
  l: string;
  h: number;
  t: number;
  st: number;
  bt: number;
  mc: string;
  p: string;
  p24: string;
  p7: string;
  v24: string;
  l24: string;
  h24: number;
  cat: string;
}

let socket: WebSocket | null = null;
const subscribers = new Map<string, Subscriber>();
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let isIntentionalClose = false;

const MAX_RECONNECT_DELAY = 30000;
const BASE_DELAY = 1000;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;

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
      // Silent error
    }
  });
};

const notifyStatusChange = (connected: boolean) => {
  subscribers.forEach(sub => {
    sub.onStatusChange?.(connected);
  });
};

const transformToken = (token: RawTokenData, timestamp: number) => ({
  chainId: token.c,
  tokenAddress: token.a,
  address: token.a,
  symbol: token.s,
  name: token.n,
  coinName: token.n,
  imageUrl: token.i,
  avatar: token.i,
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
  category: token.cat === 'NEW' ? 'new' : token.cat === 'NEAR_MIGRATE' ? 'almost_bonded' : 'migrated',
  timestamp,
  fee: '0',
  metainfo: {
    telegram: null,
    x: null,
  },
  traderCount: 0,
});

const connect = () => {
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return;
  }

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      //Connection Successful
      reconnectAttempts = 0;
      notifyStatusChange(true);

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'subscribe', channel: 'tokens' }));
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const rawData = JSON.parse(event.data);

        if (rawData.type === 'ping') {
          socket?.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        const tokensToProcess = Array.isArray(rawData.data) ? rawData.data : 
                                Array.isArray(rawData) ? rawData : null;

        if (!tokensToProcess) {
          notifySubscribers(rawData);
          return;
        }

        const timestamp = rawData.timestamp || Date.now();
        const transformedData = tokensToProcess.map((token: RawTokenData) => 
          transformToken(token, timestamp)
        );

        notifySubscribers(transformedData);
      } catch (error) {
        // Silent error
      }
    };

    socket.onclose = () => {
      socket = null;
      notifyStatusChange(false);

      if (!isIntentionalClose && subscribers.size > 0) {
        const delay = getReconnectDelay(reconnectAttempts);
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, delay);
      }
    };

    socket.onerror = () => {
      // Silent error
    };
  } catch (error) {
    // Silent error
  }
};

export const subscribeSocket = (
  id: string,
  onMessage: MessageCallback,
  onStatusChange?: StatusCallback
): (() => void) => {
  subscribers.set(id, { id, onMessage, onStatusChange });

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    isIntentionalClose = false;
    connect();
  } else if (socket.readyState === WebSocket.OPEN) {
    onStatusChange?.(true);
  }

  return () => {
    subscribers.delete(id);

    if (subscribers.size === 0) {
      isIntentionalClose = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (socket?.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ action: 'unsubscribe' }));
        } catch {
          // Silent error
        }
        socket.close();
      }
      socket = null;
      reconnectAttempts = 0;
    }
  };
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
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
