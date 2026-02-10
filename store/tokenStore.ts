import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TrenchTokenData } from '@/components/features/trench/trench-token-card';

const MAX_TOKENS_PER_CATEGORY = 50;
const CATEGORIES = ['new', 'almost_bonded', 'migrated'] as const;
type Category = typeof CATEGORIES[number];

interface TokenStore {
  // Token arrays for each category
  newTokensArray: TrenchTokenData[];
  almostBondedTokensArray: TrenchTokenData[];
  migratedTokensArray: TrenchTokenData[];
  
  // Connection state
  isConnected: boolean;
  error: string | null;
  
  // Pending updates for hovered panels
  pendingUpdates: Map<string, { token: TrenchTokenData; type: 'add' | 'update' }>;
  
  // Actions
  addOrUpdateToken: (token: TrenchTokenData) => void;
  addOrUpdateTokens: (tokens: TrenchTokenData[]) => void;
  updateExistingTokens: (tokens: TrenchTokenData[]) => void; // New: update only existing tokens
  setSnapshotTokens: (tokens: TrenchTokenData[], category: Category) => void;
  clearCategory: (category: Category) => void;
  clearAll: () => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  addPendingUpdate: (token: TrenchTokenData, type: 'add' | 'update') => void;
  applyPendingUpdates: () => void;
  clearPendingUpdates: () => void;
}

// Helper function to add or update token in array
const addOrUpdateTokenInArray = (array: TrenchTokenData[], token: TrenchTokenData): TrenchTokenData[] => {
  const existingIndex = array.findIndex(t => t.tokenAddress === token.tokenAddress);
  
  if (existingIndex >= 0) {
    // Update existing token - keep position, update data
    // IMPORTANT: Keep the original timestamp (creation time), don't overwrite it
    const newArray = [...array];
    newArray[existingIndex] = {
      ...token,
      timestamp: array[existingIndex].timestamp // Preserve original creation timestamp
    };
    return newArray;
  } else {
    // Add new token at the beginning
    const newArray = [token, ...array];
    // Keep only the latest 50 tokens
    return newArray.slice(0, MAX_TOKENS_PER_CATEGORY);
  }
};

// Helper function to update only existing tokens (skip if not found)
const updateExistingTokenInArray = (array: TrenchTokenData[], token: TrenchTokenData): TrenchTokenData[] => {
  const existingIndex = array.findIndex(t => t.tokenAddress === token.tokenAddress);
  
  if (existingIndex >= 0) {
    // Update existing token - keep position, update data
    // IMPORTANT: Keep the original timestamp (creation time), don't overwrite it
    const newArray = [...array];
    newArray[existingIndex] = {
      ...token,
      timestamp: array[existingIndex].timestamp // Preserve original creation timestamp
    };
    return newArray;
  } else {
    // Token not found - skip (don't add)
    return array;
  }
};

export const useTokenStore = create<TokenStore>()(
  devtools(
    (set, get) => ({
      newTokensArray: [],
      almostBondedTokensArray: [],
      migratedTokensArray: [],
      isConnected: false,
      error: null,
      pendingUpdates: new Map(),

      addOrUpdateToken: (token) => set((state) => {
        const category = token.category;
        
        if (category === 'new') {
          return {
            newTokensArray: addOrUpdateTokenInArray(state.newTokensArray, token)
          };
        } else if (category === 'almost_bonded') {
          return {
            almostBondedTokensArray: addOrUpdateTokenInArray(state.almostBondedTokensArray, token)
          };
        } else if (category === 'migrated') {
          return {
            migratedTokensArray: addOrUpdateTokenInArray(state.migratedTokensArray, token)
          };
        }
        
        return {};
      }),

      addOrUpdateTokens: (tokens) => set((state) => {
        let newTokensArray = [...state.newTokensArray];
        let almostBondedTokensArray = [...state.almostBondedTokensArray];
        let migratedTokensArray = [...state.migratedTokensArray];

        tokens.forEach(token => {
          if (token.category === 'new') {
            newTokensArray = addOrUpdateTokenInArray(newTokensArray, token);
          } else if (token.category === 'almost_bonded') {
            almostBondedTokensArray = addOrUpdateTokenInArray(almostBondedTokensArray, token);
          } else if (token.category === 'migrated') {
            migratedTokensArray = addOrUpdateTokenInArray(migratedTokensArray, token);
          }
        });

        return {
          newTokensArray,
          almostBondedTokensArray,
          migratedTokensArray,
        };
      }),

      updateExistingTokens: (tokens) => set((state) => {
        let newTokensArray = [...state.newTokensArray];
        let almostBondedTokensArray = [...state.almostBondedTokensArray];
        let migratedTokensArray = [...state.migratedTokensArray];

        tokens.forEach(token => {
          if (token.category === 'new') {
            newTokensArray = updateExistingTokenInArray(newTokensArray, token);
          } else if (token.category === 'almost_bonded') {
            almostBondedTokensArray = updateExistingTokenInArray(almostBondedTokensArray, token);
          } else if (token.category === 'migrated') {
            migratedTokensArray = updateExistingTokenInArray(migratedTokensArray, token);
          }
        });

        return {
          newTokensArray,
          almostBondedTokensArray,
          migratedTokensArray,
        };
      }),

      setSnapshotTokens: (tokens, category) => set((state) => {
        // Limit to 50 tokens
        const limitedTokens = tokens.slice(0, MAX_TOKENS_PER_CATEGORY);
        
        if (category === 'new') {
          return { newTokensArray: limitedTokens };
        } else if (category === 'almost_bonded') {
          return { almostBondedTokensArray: limitedTokens };
        } else if (category === 'migrated') {
          return { migratedTokensArray: limitedTokens };
        }
        
        return {};
      }),

      clearCategory: (category) => set((state) => {
        if (category === 'new') {
          return { newTokensArray: [] };
        } else if (category === 'almost_bonded') {
          return { almostBondedTokensArray: [] };
        } else if (category === 'migrated') {
          return { migratedTokensArray: [] };
        }
        return {};
      }),

      clearAll: () => set({
        newTokensArray: [],
        almostBondedTokensArray: [],
        migratedTokensArray: [],
      }),

      setIsConnected: (connected) => set({ isConnected: connected }),

      setError: (error) => set({ error }),

      addPendingUpdate: (token, type) => set((state) => ({
        pendingUpdates: new Map(state.pendingUpdates).set(token.tokenAddress, { token, type }),
      })),

      applyPendingUpdates: () => {
        const { pendingUpdates, addOrUpdateTokens, updateExistingTokens } = get();
        if (pendingUpdates.size > 0) {
          const addTokens: TrenchTokenData[] = [];
          const updateTokens: TrenchTokenData[] = [];
          
          pendingUpdates.forEach(({ token, type }) => {
            if (type === 'add') {
              addTokens.push(token);
            } else if (type === 'update') {
              updateTokens.push(token);
            }
          });
          
          if (addTokens.length > 0) {
            addOrUpdateTokens(addTokens);
          }
          if (updateTokens.length > 0) {
            updateExistingTokens(updateTokens);
          }
          
          set({ pendingUpdates: new Map() });
        }
      },

      clearPendingUpdates: () => set({ pendingUpdates: new Map() }),
    }),
    { name: 'TokenStore' }
  )
);
