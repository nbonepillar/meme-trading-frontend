type TransactionMessageCallback = (data: unknown) => void;
type TransactionStatusCallback = (connected: boolean) => void;

interface TransactionSubscriber {
  id: string;
  tokenAddress: string;
  chainId: number;
  onMessage: TransactionMessageCallback;
  onStatusChange?: TransactionStatusCallback;
}

interface RawTransactionData {
  chain_id: string;
  token_address: string;
  tx_hash: string;
  from: string;
  to: string;
  amount: string;
  type: 'buy' | 'sell';
  price: string;
  timestamp: number;
  mc?: number; // Market cap
}

// Snapshot transaction format from backend
interface SnapshotTransactionData {
  amount_native: number;
  amount_token: number;
  chain_id: string;
  id: number;
  timestamp: number;
  token_address: string;
  tx_hash: string;
  type: 'buy' | 'sell' | 'unknown';
  wallet_address: string;
  mc?: number; // Market cap
}

interface TransactionWebSocketMessage {
  channel: string;
  type: 'update' | 'snapshot';
  data: RawTransactionData | {
    chainId: string;
    tokenAddress: string;
    transactions: SnapshotTransactionData[];
  };
  timestamp: number;
}

export interface TransactionData {
  id: string;
  chainId: string;
  tokenAddress: string;
  txHash: string;
  from: string;
  to: string;
  amount: number;
  type: 'buy' | 'sell';
  price: number;
  timestamp: number;
  age: string;
  // Raw values from backend
  amountNative?: number;
  amountToken?: number;
  mc?: number; // Market cap from backend
}

let transactionSocket: WebSocket | null = null;
const transactionSubscribers = new Map<string, TransactionSubscriber>();
let transactionReconnectAttempts = 0;
let transactionReconnectTimer: NodeJS.Timeout | null = null;
let isTransactionIntentionalClose = false;

const MAX_RECONNECT_DELAY = 30000;
const BASE_DELAY = 1000;
const transactionWsUrl = process.env.NEXT_PUBLIC_TRANSACTIONS_WS_URL || 'ws://192.168.1.47:8081/ws';

const getReconnectDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
};

const transformTransaction = (tx: RawTransactionData): TransactionData => {
  const now = Date.now();
  const ageMs = now - (tx.timestamp * 1000);
  const ageMinutes = Math.floor(ageMs / 60000);
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);
  
  let age: string;
  if (ageDays > 0) {
    age = `${ageDays}d`;
  } else if (ageHours > 0) {
    age = `${ageHours}h`;
  } else if (ageMinutes > 0) {
    age = `${ageMinutes}m`;
  } else {
    age = 'now';
  }

  return {
    id: tx.tx_hash,
    chainId: tx.chain_id,
    tokenAddress: tx.token_address,
    txHash: tx.tx_hash,
    from: tx.from,
    to: tx.to,
    amount: parseFloat(tx.amount) / 1e9, // Convert lamports to SOL
    type: tx.type,
    price: parseFloat(tx.price),
    timestamp: tx.timestamp,
    age,
    mc: tx.mc // Include market cap
  };
};

// Transform snapshot transaction data to our format
const transformSnapshotTransaction = (tx: SnapshotTransactionData): TransactionData => {
  const now = Date.now();
  const ageMs = now - (tx.timestamp * 1000);
  const ageMinutes = Math.floor(ageMs / 60000);
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);
  
  let age: string;
  if (ageDays > 0) {
    age = `${ageDays}d`;
  } else if (ageHours > 0) {
    age = `${ageHours}h`;
  } else if (ageMinutes > 0) {
    age = `${ageMinutes}m`;
  } else {
    age = 'now';
  }

  // Calculate price from native amount and token amount
  const price = tx.amount_token > 0 ? (tx.amount_native / 1e9) / (tx.amount_token / 1e9) : 0;

  return {
    id: tx.tx_hash || `${tx.id}-${tx.timestamp}`, // Use tx_hash or fallback to id+timestamp
    chainId: tx.chain_id,
    tokenAddress: tx.token_address,
    txHash: tx.tx_hash || '',
    from: tx.wallet_address,
    to: tx.wallet_address, // For snapshot data, we only have wallet_address
    amount: tx.amount_token / 1e9, // Convert lamports to SOL
    type: tx.type === 'unknown' ? 'buy' : tx.type, // Default unknown to buy
    price: price,
    timestamp: tx.timestamp,
    age,
    // Include raw values from backend
    amountNative: tx.amount_native,
    amountToken: tx.amount_token,
    mc: tx.mc // Include market cap
  };
};

const notifyTransactionSubscribers = (data: TransactionData | TransactionData[], tokenAddress: string, chainId: number) => {
  transactionSubscribers.forEach(sub => {
    if (sub.tokenAddress === tokenAddress && sub.chainId === chainId) {
      try {
        sub.onMessage(data);
      } catch (error) {
        console.error('[TransactionsWebSocket] Error in subscriber callback:', error);
      }
    }
  });
};

const notifyTransactionStatusChange = (connected: boolean) => {
  transactionSubscribers.forEach(sub => {
    sub.onStatusChange?.(connected);
  });
};

const connectTransactions = () => {
  if (transactionSocket && (transactionSocket.readyState === WebSocket.CONNECTING || transactionSocket.readyState === WebSocket.OPEN)) {
    console.log('[TransactionsWebSocket] Already connected or connecting');
    return;
  }

  try {
    console.log('[TransactionsWebSocket] Connecting to:', transactionWsUrl);
    transactionSocket = new WebSocket(transactionWsUrl);

    transactionSocket.onopen = () => {
      console.log('[TransactionsWebSocket] ✅ Connected successfully');
      transactionReconnectAttempts = 0;
      notifyTransactionStatusChange(true);

      // Subscribe to all active tokens
      transactionSubscribers.forEach(sub => {
        if (transactionSocket?.readyState === WebSocket.OPEN) {
          const subscribeMessage = {
            action: 'subscribe',
            channel: 'tokenTransactions',
            data: [{
              chainId: sub.chainId.toString(),
              tokenAddress: sub.tokenAddress
            }]
          };
          console.log('[TransactionsWebSocket] 📤 Subscribing:', subscribeMessage);
          transactionSocket.send(JSON.stringify(subscribeMessage));
        }
      });
    };

    transactionSocket.onmessage = (event: MessageEvent) => {
      try {
        const rawData = JSON.parse(event.data);

        // Handle ping/pong
        if (rawData.type === 'ping' || (rawData as any).type === 'ping') {
          transactionSocket?.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        console.log('[TransactionsWebSocket] 📨 Raw message:', rawData);

        // Handle different message formats
        
        // Format 1: type: "transaction" with data field
        if (rawData.type === 'transaction' && rawData.channel === 'tokenTransactions' && rawData.data) {
          console.log('[TransactionsWebSocket] 🔄 Received transaction update');
          const txData = rawData.data;
          
          // Transform to our format
          const transformedTx: TransactionData = {
            id: txData.tx_hash,
            chainId: txData.chain_id,
            tokenAddress: txData.token_address,
            txHash: txData.tx_hash,
            from: txData.from,
            to: txData.to,
            amount: parseFloat(txData.amount) / 1e9,
            type: txData.type === 'buy' ? 'buy' : 'sell',
            price: parseFloat(txData.price),
            timestamp: txData.timestamp,
            age: 'now',
            // Store raw values if available
            amountNative: txData.amount_native,
            amountToken: txData.amount_token || parseFloat(txData.amount),
            mc: txData.mc // Include market cap
          };
          
          console.log('[TransactionsWebSocket] 📦 Transformed transaction:', transformedTx);
          
          notifyTransactionSubscribers(
            transformedTx,
            txData.token_address,
            parseInt(txData.chain_id)
          );
          return;
        }

        const message = rawData as TransactionWebSocketMessage;

        // Format 2: Original format with type: "update" or "snapshot"
        if (message.channel === 'tokenTransactions') {
          console.log('[TransactionsWebSocket] 📨 Message type:', message.type);
          console.log('[TransactionsWebSocket] 📨 Message data:', message.data);
          
          if (message.type === 'snapshot' && message.data && typeof message.data === 'object' && 'transactions' in message.data) {
            // Handle snapshot data with transactions array
            const snapshotData = message.data as { chainId: string; tokenAddress: string; transactions: SnapshotTransactionData[] };
            console.log('[TransactionsWebSocket] 📦 Received snapshot with', snapshotData.transactions.length, 'transactions');
            console.log('[TransactionsWebSocket] 📦 Sample transaction:', snapshotData.transactions[0]);
            
            // Transform all transactions in the snapshot
            const transformedTransactions = snapshotData.transactions.map(tx => transformSnapshotTransaction(tx));
            console.log('[TransactionsWebSocket] 📦 Transformed sample:', transformedTransactions[0]);
            
            // Send as bulk data
            notifyTransactionSubscribers(
              transformedTransactions,
              snapshotData.tokenAddress,
              parseInt(snapshotData.chainId)
            );
          } else if (message.type === 'update' && message.data && typeof message.data === 'object' && 'chain_id' in message.data) {
            // Handle individual transaction updates
            console.log('[TransactionsWebSocket] 🔄 Received update');
            const transactionData = transformTransaction(message.data as RawTransactionData);
            notifyTransactionSubscribers(
              transactionData,
              (message.data as RawTransactionData).token_address,
              parseInt((message.data as RawTransactionData).chain_id)
            );
          } else {
            console.warn('[TransactionsWebSocket] ⚠️ Unknown message format:', message);
          }
        }
      } catch (error) {
        console.error('[TransactionsWebSocket] ❌ Error parsing message:', error);
      }
    };

    transactionSocket.onclose = () => {
      console.log('[TransactionsWebSocket] 🔌 Connection closed');
      transactionSocket = null;
      notifyTransactionStatusChange(false);

      if (!isTransactionIntentionalClose && transactionSubscribers.size > 0) {
        const delay = getReconnectDelay(transactionReconnectAttempts);
        console.log(`[TransactionsWebSocket] 🔄 Reconnecting in ${delay}ms (attempt ${transactionReconnectAttempts + 1})`);
        transactionReconnectTimer = setTimeout(() => {
          transactionReconnectAttempts++;
          connectTransactions();
        }, delay);
      }
    };

    transactionSocket.onerror = (error) => {
      console.error('[TransactionsWebSocket] ❌ Connection error:', error);
    };
  } catch (error) {
    console.error('[TransactionsWebSocket] ❌ Failed to create connection:', error);
  }
};

export const subscribeToTransactions = (
  id: string,
  tokenAddress: string,
  chainId: number,
  onMessage: TransactionMessageCallback,
  onStatusChange?: TransactionStatusCallback
): (() => void) => {
  console.log('[TransactionsWebSocket] 📝 Adding subscriber:', { id, tokenAddress, chainId });
  
  transactionSubscribers.set(id, { 
    id, 
    tokenAddress, 
    chainId,
    onMessage, 
    onStatusChange 
  });

  if (!transactionSocket || transactionSocket.readyState === WebSocket.CLOSED) {
    isTransactionIntentionalClose = false;
    connectTransactions();
  } else if (transactionSocket.readyState === WebSocket.OPEN) {
    // Already connected, send subscribe message for new subscriber
    const subscribeMessage = {
      action: 'subscribe',
      channel: 'tokenTransactions',
      data: [{
        chainId: chainId.toString(),
        tokenAddress: tokenAddress
      }]
    };
    console.log('[TransactionsWebSocket] 📤 Subscribing:', subscribeMessage);
    transactionSocket.send(JSON.stringify(subscribeMessage));
    onStatusChange?.(true);
  } else if (transactionSocket.readyState === WebSocket.CONNECTING) {
    // Connection is in progress, wait for it to open
    console.log('[TransactionsWebSocket] ⏳ Connection in progress, waiting...');
    const checkConnection = setInterval(() => {
      if (transactionSocket?.readyState === WebSocket.OPEN) {
        clearInterval(checkConnection);
        const subscribeMessage = {
          action: 'subscribe',
          channel: 'tokenTransactions',
          data: [{
            chainId: chainId.toString(),
            tokenAddress: tokenAddress
          }]
        };
        console.log('[TransactionsWebSocket] 📤 Subscribing:', subscribeMessage);
        transactionSocket.send(JSON.stringify(subscribeMessage));
        onStatusChange?.(true);
      } else if (!transactionSocket || transactionSocket.readyState === WebSocket.CLOSED) {
        clearInterval(checkConnection);
        isTransactionIntentionalClose = false;
        connectTransactions();
      }
    }, 100);
  }

  return () => {
    console.log('[TransactionsWebSocket] 🗑️ Removing subscriber:', id);
    
    const subscriber = transactionSubscribers.get(id);
    if (subscriber && transactionSocket?.readyState === WebSocket.OPEN) {
      // Unsubscribe from this specific token
      const unsubscribeMessage = {
        action: 'unsubscribe',
        channel: 'tokenTransactions',
        data: [{
          chainId: subscriber.chainId.toString(),
          tokenAddress: subscriber.tokenAddress
        }]
      };
      console.log('[TransactionsWebSocket] 📤 Unsubscribing:', unsubscribeMessage);
      transactionSocket.send(JSON.stringify(unsubscribeMessage));
    }
    
    transactionSubscribers.delete(id);

    if (transactionSubscribers.size === 0) {
      console.log('[TransactionsWebSocket] 🔌 No more subscribers, closing connection');
      isTransactionIntentionalClose = true;
      if (transactionReconnectTimer) {
        clearTimeout(transactionReconnectTimer);
        transactionReconnectTimer = null;
      }
      if (transactionSocket?.readyState === WebSocket.OPEN) {
        try {
          if (subscriber) {
            const unsubscribeMessage = {
              action: 'unsubscribe',
              channel: 'tokenTransactions',
              data: [{
                chainId: subscriber.chainId.toString(),
                tokenAddress: subscriber.tokenAddress
              }]
            };
            console.log('[TransactionsWebSocket] 📤 Final unsubscribe:', unsubscribeMessage);
            transactionSocket.send(JSON.stringify(unsubscribeMessage));
          }
          
          // Close connection after a short delay
          setTimeout(() => {
            if (transactionSocket?.readyState === WebSocket.OPEN) {
              transactionSocket.close();
            }
          }, 100);
        } catch (error) {
          console.error('[TransactionsWebSocket] Error during cleanup:', error);
          transactionSocket.close();
        }
      }
      transactionSocket = null;
      transactionReconnectAttempts = 0;
    }
  };
};

export const getTransactionSocket = () => transactionSocket;

export const disconnectTransactionSocket = () => {
  isTransactionIntentionalClose = true;
  transactionSubscribers.clear();
  if (transactionReconnectTimer) {
    clearTimeout(transactionReconnectTimer);
    transactionReconnectTimer = null;
  }
  transactionSocket?.close();
  transactionSocket = null;
  transactionReconnectAttempts = 0;
};
