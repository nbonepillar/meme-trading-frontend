'use client';

import { useEffect } from 'react';
import { subscribeSocket } from '@/lib/websocket';
import { useTokenStore } from '@/store/tokenStore';
import { useUIStore } from '@/store/uiStore';
import type { TrenchTokenData } from '@/components/features/trench/trench-token-card';

let batchQueue: TrenchTokenData[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY = 1000;

export function useWebSocketTokensZustand(initialTokens: TrenchTokenData[]) {
  const hoveredPanel = useUIStore((state) => state.hoveredPanel);
  const { addOrUpdateTokens, setIsConnected, setError, addPendingUpdate, applyPendingUpdates } = useTokenStore();

  useEffect(() => {
    if (initialTokens.length > 0) {
      addOrUpdateTokens(initialTokens);
    }
  }, [addOrUpdateTokens, initialTokens]);

  useEffect(() => {
    if (hoveredPanel === null) {
      applyPendingUpdates();
    }
  }, [hoveredPanel, applyPendingUpdates]);

  useEffect(() => {
    const processBatch = (tokens: TrenchTokenData[]) => {
      const now = Date.now();
      const validTokens = tokens
        .filter(token => token.category && token.tokenAddress)
        .map(token => ({
          ...token,
          timestamp: token.timestamp > 0 ? token.timestamp : now,
        }));

      if (validTokens.length === 0) return;

      const [hoveredTokens, nonHoveredTokens] = validTokens.reduce<[TrenchTokenData[], TrenchTokenData[]]>(
        ([hovered, nonHovered], token) => {
          if (token.category === hoveredPanel) {
            hovered.push(token);
          } else {
            nonHovered.push(token);
          }
          return [hovered, nonHovered];
        },
        [[], []]
      );

      if (nonHoveredTokens.length > 0) {
        addOrUpdateTokens(nonHoveredTokens);
      }

      if (hoveredTokens.length > 0) {
        hoveredTokens.forEach((token) => addPendingUpdate(token, 'update'));
      }

      setError(null);
    };

    const handleMessage = (data: unknown) => {
      const tokens = Array.isArray(data) ? data : [data];
      batchQueue.push(...tokens);

      if (batchTimeout) clearTimeout(batchTimeout);
      batchTimeout = setTimeout(() => {
        processBatch(batchQueue);
        batchQueue = [];
        batchTimeout = null;
      }, BATCH_DELAY);
    };

    const handleStatusChange = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) setError(null);
    };

    const unsubscribe = subscribeSocket('trench-tokens', handleMessage, handleStatusChange);

    return () => {
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }
      unsubscribe();
    };
  }, [hoveredPanel, addOrUpdateTokens, setIsConnected, setError, addPendingUpdate, applyPendingUpdates]);
}
