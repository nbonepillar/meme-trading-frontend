'use client';

import { useEffect } from 'react';
import { subscribeTrenchesSocket } from '@/lib/trenches-websocket';
import { useTokenStore } from '@/store/tokenStore';
import { useUIStore } from '@/store/uiStore';
import type { TrenchTokenData } from '@/components/features/trench/trench-token-card';

interface WebSocketMessage {
  type: 'snapshot' | 'update' | 'add' | 'remove';
  data: TrenchTokenData[];
  timestamp: number;
}

export function useTrenchesWebSocket() {
  const { 
    addOrUpdateToken,
    addOrUpdateTokens,
    updateExistingTokens, // Add new action
    setSnapshotTokens,
    setIsConnected, 
    setError, 
    addPendingUpdate, 
    applyPendingUpdates,
    clearAll // Add clearAll to cleanup data when leaving page
  } = useTokenStore();

  const selectedChainId = useUIStore((state) => state.selectedChainId);

  // Apply pending updates when hover is released - use separate effect without hoveredPanel in deps
  useEffect(() => {
    const unsubscribe = useUIStore.subscribe(
      (state) => {
        if (state.hoveredPanel === null) {
          applyPendingUpdates();
        }
      }
    );
    return unsubscribe;
  }, [applyPendingUpdates]);

  useEffect(() => {
    console.log('[useTrenchesWebSocket] 🚀 Initializing WebSocket connection with chainId:', selectedChainId);

    const handleMessage = (data: unknown) => {
      console.log('[useTrenchesWebSocket] 📨 Received message:', data);
      
      const message = data as WebSocketMessage;
      
      if (!message || !Array.isArray(message.data)) {
        console.warn('[useTrenchesWebSocket] ⚠️ Invalid message format:', message);
        return;
      }

      const tokens = message.data;
      console.log('[useTrenchesWebSocket] 📦 Processing', tokens.length, 'tokens, type:', message.type);
      
      // Validate tokens - don't modify timestamp here
      const validTokens = tokens.filter(token => token.category && token.tokenAddress);

      if (validTokens.length === 0) {
        console.warn('[useTrenchesWebSocket] ⚠️ No valid tokens to process');
        return;
      }

      console.log('[useTrenchesWebSocket] ✅ Valid tokens:', validTokens.length);

      // Get current hovered panel state
      const currentHoveredPanel = useUIStore.getState().hoveredPanel;

      // Handle snapshot - replace all tokens in category
      if (message.type === 'snapshot') {
        // Group by category and set snapshot for each
        const byCategory = validTokens.reduce((acc, token) => {
          if (!acc[token.category]) acc[token.category] = [];
          acc[token.category].push(token);
          return acc;
        }, {} as Record<string, TrenchTokenData[]>);

        Object.entries(byCategory).forEach(([category, tokens]) => {
          setSnapshotTokens(tokens, category as any);
        });
      } 
      // Handle add - add new tokens to the beginning
      else if (message.type === 'add') {
        
        // Separate by hovered panel
        const [hoveredTokens, nonHoveredTokens] = validTokens.reduce<[TrenchTokenData[], TrenchTokenData[]]>(
          ([hovered, nonHovered], token) => {
            if (token.category === currentHoveredPanel) {
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
          hoveredTokens.forEach(token => addPendingUpdate(token, 'add'));
        }
      }
      // Handle update - update existing tokens only
      else if (message.type === 'update') {
        
        // Separate by hovered panel
        const [hoveredTokens, nonHoveredTokens] = validTokens.reduce<[TrenchTokenData[], TrenchTokenData[]]>(
          ([hovered, nonHovered], token) => {
            if (token.category === currentHoveredPanel) {
              hovered.push(token);
            } else {
              nonHovered.push(token);
            }
            return [hovered, nonHovered];
          },
          [[], []]
        );

        if (nonHoveredTokens.length > 0) {
          updateExistingTokens(nonHoveredTokens); // Use updateExistingTokens instead
        }

        if (hoveredTokens.length > 0) {
          hoveredTokens.forEach(token => addPendingUpdate(token, 'update'));
        }
      }
      // Handle remove - ignore for now
      else if (message.type === 'remove') {
        // Do nothing - tokens will be automatically removed when exceeding 50 limit
      }

      setError(null);
    };

    const handleStatusChange = (connected: boolean) => {
      console.log('[useTrenchesWebSocket] 🔌 Connection status changed:', connected ? 'CONNECTED' : 'DISCONNECTED');
      setIsConnected(connected);
      if (connected) {
        setError(null);
      } else {
        setError('Disconnected from server');
      }
    };

    const unsubscribe = subscribeTrenchesSocket(
      'trenches-main',
      selectedChainId, // Pass chainId
      handleMessage,
      handleStatusChange
    );

    return () => {
      console.log('[useTrenchesWebSocket] 🧹 Cleaning up subscription and clearing data');
      unsubscribe();
      // Clear all token data when leaving trenches page
      clearAll();
      setIsConnected(false);
      setError(null);
    };
  }, [selectedChainId, addOrUpdateToken, addOrUpdateTokens, updateExistingTokens, setSnapshotTokens, setIsConnected, setError, addPendingUpdate, applyPendingUpdates, clearAll]);
}
