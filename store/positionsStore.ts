import { create } from 'zustand';
import { CompletedTradeData } from '@/lib/trades-websocket';

export interface Position {
  trade_id: number;
  token_address: string;
  type: 'buy_completed' | 'sell_completed';
  amount: string;
  tx_hash: string;
  status: 'completed' | 'failed' | 'pending';
  timestamp: number;
  chain_id: string;
  user_id: string;
}

export interface PositionsState {
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addPosition: (tradeData: CompletedTradeData) => void;
  updatePosition: (tradeId: number, updates: Partial<Position>) => void;
  removePosition: (tradeId: number) => void;
  clearPositions: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getPositionsByToken: (tokenAddress: string) => Position[];
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  isLoading: false,
  error: null,

  addPosition: (tradeData: CompletedTradeData) => {
    console.log('[PositionsStore] Adding new position:', tradeData);
    
    const newPosition: Position = {
      trade_id: tradeData.trade_id,
      token_address: tradeData.token_address,
      type: tradeData.type,
      amount: tradeData.amount,
      tx_hash: tradeData.tx_hash,
      status: tradeData.status,
      timestamp: tradeData.timestamp,
      chain_id: tradeData.chain_id,
      user_id: tradeData.user_id,
    };

    set((state) => {
      // Check if position already exists
      const existingIndex = state.positions.findIndex(p => p.trade_id === tradeData.trade_id);
      
      if (existingIndex >= 0) {
        // Update existing position
        const updatedPositions = [...state.positions];
        updatedPositions[existingIndex] = newPosition;
        return { positions: updatedPositions };
      } else {
        // Add new position (newest first)
        return { positions: [newPosition, ...state.positions] };
      }
    });
  },

  updatePosition: (tradeId: number, updates: Partial<Position>) => {
    console.log('[PositionsStore] Updating position:', tradeId, updates);
    
    set((state) => ({
      positions: state.positions.map(position =>
        position.trade_id === tradeId
          ? { ...position, ...updates }
          : position
      )
    }));
  },

  removePosition: (tradeId: number) => {
    console.log('[PositionsStore] Removing position:', tradeId);
    
    set((state) => ({
      positions: state.positions.filter(position => position.trade_id !== tradeId)
    }));
  },

  clearPositions: () => {
    console.log('[PositionsStore] Clearing all positions');
    set({ positions: [], error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  getPositionsByToken: (tokenAddress: string) => {
    const { positions } = get();
    return positions.filter(position => position.token_address === tokenAddress);
  },
}));