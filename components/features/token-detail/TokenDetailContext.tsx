'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  image: string;
  price: number | string; // Allow string to preserve precision from backend
  priceChange24h: number;
  liquidity: number;
  volume24h: number;
  totalFees: number;
  supply: number;
  bcurveTaxes: number;
  marketCap: number;
  holders: number;
  createdAt?: number; // Unix timestamp for token creation
  timestamp?: number; // Unix timestamp from trenches data
  // Trading stats from token card
  volume?: number; // Volume in lamports
  buyCount?: number; // Number of buy transactions
  sellCount?: number; // Number of sell transactions
  buyVolume?: number; // Buy volume in USD
  sellVolume?: number; // Sell volume in USD
  // Add more fields as needed
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeData {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  totalUsd: number;
  trader: string;
  timestamp: number;
  txHash: string;
  marketCap: number;
}

interface TokenDetailContextType {
  tokenData: TokenData | null;
  isLoading: boolean;
  error: Error | null;
  selectedTimeframe: string;
  activeHistoryTab: string;
  tradeHistory: TradeData[];
  currentPrice: number | null; // Add current price from OHLCV data
  priceChange24h: number | null; // Add 24h price change
  onTimeframeChange: (timeframe: string) => void;
  onHistoryTabChange: (tab: string) => void;
  onTradeHistoryUpdate: (trades: TradeData[] | ((prev: TradeData[]) => TradeData[])) => void;
}

const TokenDetailContext = createContext<TokenDetailContextType | null>(null);

interface TokenDetailProviderProps {
  children: ReactNode;
  value: TokenDetailContextType;
}

export function TokenDetailProvider({ children, value }: TokenDetailProviderProps) {
  return (
    <TokenDetailContext.Provider value={value}>
      {children}
    </TokenDetailContext.Provider>
  );
}

export function useTokenDetailContext() {
  const context = useContext(TokenDetailContext);
  if (!context) {
    throw new Error('useTokenDetailContext must be used within a TokenDetailProvider');
  }
  return context;
}