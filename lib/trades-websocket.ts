// WebSocket service for trade subscriptions and real-time trade updates

export interface TradeSubscriptionData {
  tokenAddress: string;
}

export interface TradeSubscriptionMessage {
  action: 'subscribe' | 'unsubscribe';
  channel: 'trades';
  data: TradeSubscriptionData[];
}

export interface CompletedTradeData {
  type: 'buy_completed' | 'sell_completed';
  user_id: string;
  token_address: string;
  amount: string;
  tx_hash: string;
  status: 'completed' | 'failed' | 'pending';
  timestamp: number;
  chain_id: string;
  trade_id: number;
}

export interface TradeWebSocketMessage {
  channel: 'trades';
  type: 'buy_completed' | 'sell_completed';
  data: CompletedTradeData;
  timestamp: number;
}

class TradesWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private subscribers = new Map<string, (data: CompletedTradeData) => void>();
  private connectionStatusCallbacks = new Set<(connected: boolean) => void>();
  private subscribedTokens = new Set<string>();

  constructor(private wsUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log('[TradesWebSocket] Connecting to:', this.wsUrl);

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('[TradesWebSocket] Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionStatus(true);
          
          // Resubscribe to all previously subscribed tokens
          if (this.subscribedTokens.size > 0) {
            this.resubscribeAll();
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: TradeWebSocketMessage = JSON.parse(event.data);
            console.log('[TradesWebSocket] Received message:', message);
            
            if (message.channel === 'trades' && message.data) {
              // Notify all subscribers for this token
              const tokenAddress = message.data.token_address;
              const callback = this.subscribers.get(tokenAddress);
              if (callback) {
                callback(message.data);
              }
            }
          } catch (error) {
            console.error('[TradesWebSocket] Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[TradesWebSocket] Connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.notifyConnectionStatus(false);
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[TradesWebSocket] WebSocket error:', error);
          this.isConnecting = false;
          this.notifyConnectionStatus(false);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        console.error('[TradesWebSocket] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[TradesWebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  private resubscribeAll() {
    if (this.subscribedTokens.size === 0) return;

    const subscribeMessage: TradeSubscriptionMessage = {
      action: 'subscribe',
      channel: 'trades',
      data: Array.from(this.subscribedTokens).map(tokenAddress => ({ tokenAddress }))
    };

    this.sendMessage(subscribeMessage);
  }

  private sendMessage(message: TradeSubscriptionMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[TradesWebSocket] Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[TradesWebSocket] Cannot send message - WebSocket not connected');
    }
  }

  subscribe(tokenAddress: string, callback: (data: CompletedTradeData) => void) {
    console.log('[TradesWebSocket] Subscribing to trades for token:', tokenAddress);
    
    this.subscribers.set(tokenAddress, callback);
    this.subscribedTokens.add(tokenAddress);

    // Send subscription message if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      const subscribeMessage: TradeSubscriptionMessage = {
        action: 'subscribe',
        channel: 'trades',
        data: [{ tokenAddress }]
      };
      this.sendMessage(subscribeMessage);
    } else {
      // Connect and then subscribe
      this.connect().then(() => {
        const subscribeMessage: TradeSubscriptionMessage = {
          action: 'subscribe',
          channel: 'trades',
          data: [{ tokenAddress }]
        };
        this.sendMessage(subscribeMessage);
      }).catch(console.error);
    }
  }

  unsubscribe(tokenAddress: string) {
    console.log('[TradesWebSocket] Unsubscribing from trades for token:', tokenAddress);
    
    this.subscribers.delete(tokenAddress);
    this.subscribedTokens.delete(tokenAddress);

    // Send unsubscription message if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage: TradeSubscriptionMessage = {
        action: 'unsubscribe',
        channel: 'trades',
        data: [{ tokenAddress }]
      };
      this.sendMessage(unsubscribeMessage);
    }
  }

  onConnectionStatusChange(callback: (connected: boolean) => void) {
    this.connectionStatusCallbacks.add(callback);
    
    // Immediately notify current status
    callback(this.ws?.readyState === WebSocket.OPEN);
    
    return () => {
      this.connectionStatusCallbacks.delete(callback);
    };
  }

  private notifyConnectionStatus(connected: boolean) {
    this.connectionStatusCallbacks.forEach(callback => callback(connected));
  }

  disconnect() {
    console.log('[TradesWebSocket] Disconnecting...');
    
    // Send unsubscribe messages for all subscribed tokens
    if (this.subscribedTokens.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage: TradeSubscriptionMessage = {
        action: 'unsubscribe',
        channel: 'trades',
        data: Array.from(this.subscribedTokens).map(tokenAddress => ({ tokenAddress }))
      };
      this.sendMessage(unsubscribeMessage);
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.subscribers.clear();
    this.subscribedTokens.clear();
    this.connectionStatusCallbacks.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  getConnectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Global instance
const wsUrl = process.env.NEXT_PUBLIC_TRADES_WS_URL!;
const tradesWebSocketService = new TradesWebSocketService(wsUrl);

export default tradesWebSocketService;

// Helper function for components
export function subscribeToTrades(
  tokenAddress: string,
  onTradeCompleted: (data: CompletedTradeData) => void,
  onConnectionStatusChange?: (connected: boolean) => void
) {
  console.log('[TradesWebSocket] Setting up subscription for:', tokenAddress);

  // Subscribe to trade updates
  tradesWebSocketService.subscribe(tokenAddress, onTradeCompleted);

  // Subscribe to connection status if callback provided
  let unsubscribeStatus: (() => void) | undefined;
  if (onConnectionStatusChange) {
    unsubscribeStatus = tradesWebSocketService.onConnectionStatusChange(onConnectionStatusChange);
  }

  // Return cleanup function
  return () => {
    console.log('[TradesWebSocket] Cleaning up subscription for:', tokenAddress);
    tradesWebSocketService.unsubscribe(tokenAddress);
    if (unsubscribeStatus) {
      unsubscribeStatus();
    }
  };
}