import { create } from 'zustand';

export interface KlineData {
  open_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataState {
  klines: KlineData[];
  totalCount: number;
  period: string;
  tokenAddress: string;
  chainId: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setKlines: (klines: KlineData[]) => void;
  addKline: (kline: KlineData) => void;
  updateLastKline: (kline: KlineData) => void;
  setChartData: (data: {
    klines: KlineData[];
    totalCount: number;
    period: string;
    tokenAddress: string;
    chainId: number;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export const useChartDataStore = create<ChartDataState>((set, get) => ({
  klines: [],
  totalCount: 0,
  period: '1m',
  tokenAddress: '',
  chainId: 501, // Default to Solana
  isLoading: false,
  error: null,

  setKlines: (klines) => set({ klines }),
  
  addKline: (kline) => set((state) => ({
    klines: [...state.klines, kline]
  })),
  
  updateLastKline: (kline) => set((state) => {
    const newKlines = [...state.klines];
    if (newKlines.length > 0) {
      newKlines[newKlines.length - 1] = kline;
    }
    return { klines: newKlines };
  }),
  
  setChartData: (data) => set({
    klines: data.klines,
    totalCount: data.totalCount,
    period: data.period,
    tokenAddress: data.tokenAddress,
    chainId: data.chainId,
    error: null
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearData: () => set({
    klines: [],
    totalCount: 0,
    period: '1m',
    tokenAddress: '',
    chainId: 501,
    isLoading: false,
    error: null
  })
}));