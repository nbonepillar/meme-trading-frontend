// Portfolio API Client Functions

// Always use the backend server directly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.1.47:8080';

console.log('[portfolio-api] API_BASE_URL:', API_BASE_URL);

// Unified transaction type for all endpoints
export interface Transaction {
  id: number;
  token_address: string;
  name: string;
  symbol: string;
  meta_data: string;
  bought_amount_native: number;
  bought_amount_token: number;
  sold_amount_native: number;
  sold_amount_token: number;
  chain_id: number;
  created_at: number;
  holding_duration: string;
  quote: number;
}

export interface TransactionsResponse {
  status: number;
  message: string;
  transactions: Transaction[];
  total: number;
  pagination: {
    limit: number;
    total: number;
  };
}

// Legacy types for backward compatibility
export interface Position {
  id: number;
  chain_id: number;
  token_address: string;
  tx_hash: string;
  type: 0 | 1; // 0 = Sell, 1 = Buy
  amount_native: number;
  amount_token: number;
  created_at: number;
}

export interface PositionsResponse {
  status: number;
  message: string;
  positions: Position[];
  total: number;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface Holder {
  wallet_address: string;
  balance: string;
  percent: number;
}

export interface HoldersResponse {
  status: number;
  message: string;
  holders: Holder[];
  total: number;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// Legacy types for backward compatibility
export interface Holding {
  id: number;
  chain_id: number;
  token_address: string;
  type: number;
  amount_native: number;
  amount_token: number;
  created_at: number;
  balance?: string;
  updated_at?: number;
  name?: string;
  symbol?: string;
  meta_data?: string;
}

export interface HoldingsResponse {
  status: number;
  message: string;
  holdings: Holding[];
  total: number;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface TransactionsHistoryResponse {
  status: number;
  message: string;
  transactions: Transaction[];
  total: number;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// API Functions

/**
 * Unified function to get transactions (history/holdings/positions)
 * @param params - Query parameters
 * @param token - JWT token
 */
export async function getTransactions(
  params: {
    holding?: 1;
    tokenAddress?: string;
    chainId?: number;
    limit?: number;
  },
  token?: string
): Promise<TransactionsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.holding) queryParams.append('holding', '1');
  if (params.tokenAddress) queryParams.append('tokenAddress', params.tokenAddress);
  if (params.chainId) queryParams.append('chainId', params.chainId.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/api/tokens/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  console.log('[getTransactions] Fetching:', url, 'params:', params);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { 
    method: 'GET',
    headers
  });
  
  console.log('[getTransactions] Response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    console.error('[getTransactions] Error:', errorData);
    throw new Error(errorData.error || errorData.message || 'Failed to fetch transactions');
  }
  
  const data = await response.json();
  console.log('[getTransactions] Success:', data.transactions?.length || 0, 'transactions');
  return data;
}

/**
 * Get positions for a specific token (uses unified endpoint)
 * @param chainId - Chain ID (e.g., 501 for Solana)
 * @param tokenAddress - Token address
 * @param offset - Pagination offset (not used in new API)
 * @param limit - Pagination limit
 * @param token - JWT token
 */
export async function getTokenPositions(
  chainId: number,
  tokenAddress: string,
  offset: number = 0,
  limit: number = 50,
  token?: string
): Promise<TransactionsResponse> {
  return getTransactions({ tokenAddress, chainId, limit }, token);
}

/**
 * Get holders for a specific token
 * @param chainId - Chain ID (e.g., 501 for Solana)
 * @param tokenAddress - Token address
 * @param offset - Pagination offset
 * @param limit - Pagination limit
 * @param token - JWT token
 */
export async function getTokenHolders(
  chainId: number,
  tokenAddress: string,
  offset: number = 0,
  limit: number = 50,
  token?: string
): Promise<HoldersResponse> {
  // Direct call to backend (CORS now handled by backend)
  const url = `${API_BASE_URL}/api/tokens/${chainId}/${tokenAddress}/holders?offset=${offset}&limit=${limit}`;
  
  console.log('[getTokenHolders] Fetching directly from backend:', url);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { 
    method: 'GET',
    headers
  });
  
  console.log('[getTokenHolders] Response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    console.error('[getTokenHolders] Error:', errorData);
    throw new Error(errorData.error || errorData.message || 'Failed to fetch holders');
  }
  
  const data = await response.json();
  console.log('[getTokenHolders] Success:', data.holders?.length || 0, 'holders');
  return data;
}

/**
 * Get user's token holdings (uses unified endpoint)
 * @param offset - Pagination offset (not used in new API)
 * @param limit - Pagination limit
 * @param token - JWT token
 * @returns TransactionsResponse with transactions array
 */
export async function getUserHoldings(
  offset: number = 0,
  limit: number = 50,
  token?: string
): Promise<TransactionsResponse> {
  return getTransactions({ holding: 1, limit }, token);
}

/**
 * Get user's transaction history (uses unified endpoint)
 * @param chainId - Optional chain ID filter
 * @param tokenAddress - Optional token address filter
 * @param type - Optional transaction type filter (not used in new API)
 * @param offset - Pagination offset (not used in new API)
 * @param limit - Pagination limit
 * @param token - JWT token
 */
export async function getUserTransactionHistory(
  chainId?: number,
  tokenAddress?: string,
  type?: 0 | 1,
  offset: number = 0,
  limit: number = 50,
  token?: string
): Promise<TransactionsResponse> {
  return getTransactions({ chainId, tokenAddress, limit }, token);
}
