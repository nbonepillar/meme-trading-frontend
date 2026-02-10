import { useEffect, useState } from 'react';
import { subscribeToTrades, CompletedTradeData } from '@/lib/trades-websocket';
import { usePositionsStore } from '@/store/positionsStore';

export function useTradesWebSocket(tokenAddress: string, chainId: number) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const addPosition = usePositionsStore(state => state.addPosition);

  useEffect(() => {
    if (!tokenAddress) return;

    console.log('[useTradesWebSocket] Setting up WebSocket for token:', tokenAddress);

    const handleTradeCompleted = (tradeData: CompletedTradeData) => {
      console.log('[useTradesWebSocket] Received completed trade:', tradeData);
      
      // Add to positions store
      addPosition(tradeData);
      
      // You can add additional logic here like showing notifications
      if (tradeData.type === 'buy_completed') {
        console.log(`✅ Buy order completed: ${tradeData.amount} tokens`);
      } else if (tradeData.type === 'sell_completed') {
        console.log(`✅ Sell order completed: ${tradeData.amount} tokens`);
      }
    };

    const handleConnectionStatusChange = (connected: boolean) => {
      console.log('[useTradesWebSocket] Connection status changed:', connected);
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    };

    // Subscribe to trades WebSocket
    const unsubscribe = subscribeToTrades(
      tokenAddress,
      handleTradeCompleted,
      handleConnectionStatusChange
    );

    return () => {
      console.log('[useTradesWebSocket] Cleaning up WebSocket subscription');
      unsubscribe();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [tokenAddress, chainId, addPosition]);

  return {
    isConnected,
    connectionStatus,
  };
}