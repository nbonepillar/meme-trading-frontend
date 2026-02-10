import { create } from 'zustand';

interface TimerStore {
  now: number;
  visibleTokenAddresses: Set<string>;
  updateNow: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  setVisibleTokens: (panelId: string, addresses: string[]) => void;
  isTokenVisible: (address: string) => boolean;
  panelVisibleTokens: Map<string, Set<string>>;
}

let intervalId: NodeJS.Timeout | null = null;

export const useTimerStore = create<TimerStore>((set, get) => ({
  now: Date.now(),
  visibleTokenAddresses: new Set(),
  panelVisibleTokens: new Map(),

  updateNow: () => set({ now: Date.now() }),

  startTimer: () => {
    if (!intervalId) {
      intervalId = setInterval(() => {
        get().updateNow();
      }, 200); // 200ms for smooth updates
    }
  },

  stopTimer: () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  setVisibleTokens: (panelId, addresses) => {
    const panelVisibleTokens = new Map(get().panelVisibleTokens);
    panelVisibleTokens.set(panelId, new Set(addresses));

    // Merge all visible tokens from all panels
    const allVisibleTokens = new Set<string>();
    panelVisibleTokens.forEach((tokens) => {
      tokens.forEach((token) => allVisibleTokens.add(token));
    });

    set({
      panelVisibleTokens,
      visibleTokenAddresses: allVisibleTokens
    });
  },

  isTokenVisible: (address) => {
    return get().visibleTokenAddresses.has(address);
  },
}));

// Auto-start timer on first import
useTimerStore.getState().startTimer();
