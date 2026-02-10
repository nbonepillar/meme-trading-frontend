// API Client for Mock Server Communication

// Local type definitions
interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeData {
  id: string;
  timestamp: number;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
}

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.47:8080';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.1.47:8081/ws';

export class ApiClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers
  private onConnectionStatusChanged: ((connected: boolean) => void) | null = null;
  private onInitialDataReceived: ((data: { candles: CandleData[], trades: TradeData[], token: TokenData }) => void) | null = null;
  private onCandleUpdateReceived: ((candle: CandleData) => void) | null = null;
  private onNewCandleReceived: ((candle: CandleData) => void) | null = null;
  private onTokenUpdateReceived: ((token: TokenData) => void) | null = null;

  // REST API Methods

  /**
   * Get historical candle data for a token
   */
  async getCandles(tokenAddress: string, limit: number = 100): Promise<CandleData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/candles/${tokenAddress}?limit=${limit}`);
      const data: ApiResponse<CandleData[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch candles');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching candles:', error);
      throw error;
    }
  }

  /**
   * Get trade history for a token
   */
  async getTrades(tokenAddress: string, limit: number = 100): Promise<TradeData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades/${tokenAddress}?limit=${limit}`);
      const data: ApiResponse<TradeData[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch trades');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getToken(tokenAddress: string): Promise<TokenData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/${tokenAddress}`);
      const data: ApiResponse<TokenData> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch token data');
      }
      
      if (!data.data) {
        throw new Error('No token data received');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<{ status: string, timestamp: number, clients: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  // WebSocket Methods

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectionStatusChanged?.(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onConnectionStatusChanged?.(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onConnectionStatusChanged?.(false);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.onConnectionStatusChanged?.(false);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get WebSocket connection state
   */
  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Event Handler Registration

  /**
   * Register connection status change handler
   */
  onConnectionStatusChange(handler: (connected: boolean) => void): void {
    this.onConnectionStatusChanged = handler;
  }

  /**
   * Register initial data received handler
   */
  onInitialData(handler: (data: { candles: CandleData[], trades: TradeData[], token: TokenData }) => void): void {
    this.onInitialDataReceived = handler;
  }

  /**
   * Register candle update handler
   */
  onCandleUpdate(handler: (candle: CandleData) => void): void {
    this.onCandleUpdateReceived = handler;
  }

  /**
   * Register new candle handler
   */
  onNewCandle(handler: (candle: CandleData) => void): void {
    this.onNewCandleReceived = handler;
  }

  /**
   * Register token update handler
   */
  onTokenUpdate(handler: (token: TokenData) => void): void {
    this.onTokenUpdateReceived = handler;
  }

  // Private Methods

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'initial_data':
        // Handle initial data (special case)
        if ('candles' in message.data && 'trades' in message.data && 'token' in message.data) {
          this.onInitialDataReceived?.(message.data as any);
        }
        break;
        
      case 'candle_update':
        this.onCandleUpdateReceived?.(message.data as CandleData);
        break;
        
      case 'new_candle':
        this.onNewCandleReceived?.(message.data as CandleData);
        break;
        
      case 'token_update':
        this.onTokenUpdateReceived?.(message.data as TokenData);
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();