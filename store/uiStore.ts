import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIStore {
  showTrenchMenu: boolean;
  selectedTrench: string;
  hoveredPanel: 'new' | 'almost_bonded' | 'migrated' | null;
  quickBuyAmount: string;
  selectedChainId: number;
  toggleTrenchMenu: () => void;
  setShowTrenchMenu: (show: boolean) => void;
  setSelectedTrench: (trench: string) => void;
  setHoveredPanel: (panel: 'new' | 'almost_bonded' | 'migrated' | null) => void;
  setQuickBuyAmount: (amount: string) => void;
  setSelectedChainId: (chainId: number) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        showTrenchMenu: false,
        selectedTrench: 'Pump.fun',
        hoveredPanel: null,
        quickBuyAmount: '',
        selectedChainId: 501, // Default to SOL

        toggleTrenchMenu: () => set((state) => ({ 
          showTrenchMenu: !state.showTrenchMenu 
        })),

        setShowTrenchMenu: (show) => set({ showTrenchMenu: show }),

        setSelectedTrench: (trench) => set({ 
          selectedTrench: trench,
          showTrenchMenu: false 
        }),

        setHoveredPanel: (panel) => set({ hoveredPanel: panel }),

        setQuickBuyAmount: (amount) => set({ quickBuyAmount: amount }),

        setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
      }),
      {
        name: 'ui-storage',
      }
    ),
    { name: 'UIStore' }
  )
);
