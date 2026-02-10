// API client for communicating with mock server

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: 'initial_data' | 'candle_update' | 'new_candle' | 'trade_update' | 'token_update';
  data: any;
  timestamp: number;
}

export class MockApiClient {
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private onCandleUpdate?: (candle: CandleData) => void;
  private onNewCandle?: (candle: CandleData) => void;
  private onTradeUpdate?: (trade: TradeData) => void;
  private onTokenUpdate?: (token: TokenData) => void;
  private onInitialData?: (data: { candles: CandleData[], trades: TradeData[], token: TokenData }) => void;
  private onConnectionChange?: (connected: boolean) => void;

  constructor(baseUrl: string = 'http://192.168.1.47:8080') {
    this.baseUrl = baseUrl;
    this.wsUrl = baseUrl.replace('http', 'ws');
  }

  // REST API methods
  async getHistoricalCandles(tokenAddress: string, limit: number = 100): Promise<CandleData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/candles/${tokenAddress}?limit=${limit}`);
      const result: ApiResponse<CandleData[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch candle data');
      }
    } catch (error) {
      console.error('Error fetching historical candles:', error);
      throw error;
    }
  }

  async getTradeHistory(tokenAddress: string, limit: number = 100): Promise<TradeData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/trades/${tokenAddress}?limit=${limit}`);
      const result: ApiResponse<TradeData[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch trade data');
      }
    } catch (error) {
      console.error('Error fetching trade history:', error);
      throw error;
    }
  }

  async getTokenData(tokenAddress: string): Promise<TokenData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/token/${tokenAddress}`);
      const result: ApiResponse<TokenData> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch token data');
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      return result.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // WebSocket methods
  connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected to mock server');
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
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
        console.log('WebSocket disconnected from mock server');
        this.onConnectionChange?.(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket connection failed. Make sure mock server is running on port 3001');
        console.error('To start mock server: npm run mock-server or node mock-server/server.js');
        this.onConnectionChange?.(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'initial_data':
        this.onInitialData?.(message.data);
        break;
      case 'candle_update':
        this.onCandleUpdate?.(message.data);
        break;
      case 'new_candle':
        this.onNewCandle?.(message.data);
        break;
      case 'trade_update':
        this.onTradeUpdate?.(message.data);
        break;
      case 'token_update':
        this.onTokenUpdate?.(message.data);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event subscription methods
  onCandleUpdateReceived(callback: (candle: CandleData) => void): void {
    this.onCandleUpdate = callback;
  }

  onNewCandleReceived(callback: (candle: CandleData) => void): void {
    this.onNewCandle = callback;
  }

  onTradeUpdateReceived(callback: (trade: TradeData) => void): void {
    this.onTradeUpdate = callback;
  }

  onTokenUpdateReceived(callback: (token: TokenData) => void): void {
    this.onTokenUpdate = callback;
  }

  onInitialDataReceived(callback: (data: { candles: CandleData[], trades: TradeData[], token: TokenData }) => void): void {
    this.onInitialData = callback;
  }

  onConnectionStatusChanged(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  // Utility methods
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Create singleton instance
export const mockApiClient = new MockApiClient();