'use client';

import { useTokenStore } from '@/store/tokenStore';

export function WebSocketStatus() {
  const isConnected = useTokenStore((state) => state.isConnected);
  const error = useTokenStore((state) => state.error);
  const newCount = useTokenStore((state) => state.newTokensArray.length);
  const almostBondedCount = useTokenStore((state) => state.almostBondedTokensArray.length);
  const migratedCount = useTokenStore((state) => state.migratedTokensArray.length);

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-md text-white font-mono text-xs z-[9999] ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
      <div>WS: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      {error && <div className="text-red-200">Error: {error}</div>}
      <div className="text-[11px]">
        New: {newCount} | Almost: {almostBondedCount} | Migrated: {migratedCount}
      </div>
    </div>
  );
}
