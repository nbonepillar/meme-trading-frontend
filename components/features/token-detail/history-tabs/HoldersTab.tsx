'use client';

import { memo } from 'react';
import { useTokenDetailContext } from '../TokenDetailContext';
import { useTokenHolders } from '@/hooks/useTokenHolders';
import { useUIStore } from '@/store/uiStore';

// Format balance with proper decimals
// For Solana SPL tokens, balances are typically stored with 9 decimal places
// Example: "1000000000000" = 1,000 tokens (1000000000000 / 1e9)
function formatBalance(balance: string): string {
  const balanceNum = parseFloat(balance);
  
  // Take absolute value to handle negative balances
  const absBalance = Math.abs(balanceNum);
  
  // Divide by 1e9 to convert from smallest unit to token units
  const tokens = absBalance / 1e9;
  
  // Format based on size
  if (tokens >= 1e6) {
    // Millions
    return `${(tokens / 1e6).toFixed(2)}M`;
  } else if (tokens >= 1e3) {
    // Thousands
    return `${(tokens / 1e3).toFixed(2)}K`;
  } else if (tokens >= 1) {
    // Regular numbers
    return tokens.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  } else {
    // Small decimals
    return tokens.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }
}

const HoldersTab = memo(function HoldersTab() {
  const { tokenData } = useTokenDetailContext();
  const { selectedChainId } = useUIStore();
  
  const { data, isLoading, error } = useTokenHolders(
    selectedChainId,
    tokenData?.address || '',
    50
  );

  // Debug logging
  console.log('[HoldersTab] Render:', {
    tokenAddress: tokenData?.address,
    selectedChainId,
    isLoading,
    error,
    holdersCount: data?.holders?.length || 0,
    data
  });

  if (!tokenData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-sm">Select a token to view holders</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Error loading holders</div>
          <div className="text-gray-400 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-400 text-sm">Loading holders...</div>
        </div>
      </div>
    );
  }

  const holders = data?.holders || [];

  if (holders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-2">No holders found</div>
          <div className="text-gray-500 text-xs">No holders for {tokenData.symbol}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '724px' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-[#111214]">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-gray-400">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Wallet Address</div>
          <div className="col-span-3">Balance</div>
          <div className="col-span-3">Percentage</div>
        </div>
      </div>

      {/* Holders List - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="divide-y divide-gray-700">
          {holders.map((holder, index) => (
            <div
              key={holder.wallet_address}
              className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-800/50 transition-colors"
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <span className="text-gray-300 text-sm font-medium">
                  #{index + 1}
                </span>
              </div>

              {/* Wallet Address */}
              <div className="col-span-5 flex items-center">
                <a
                  href={`https://solscan.io/account/${holder.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-mono truncate max-w-full"
                  title={holder.wallet_address}
                >
                  {holder.wallet_address.slice(0, 12)}...{holder.wallet_address.slice(-8)}
                </a>
              </div>

              {/* Balance */}
              <div className="col-span-3 flex items-center">
                <span 
                  className="text-white text-sm font-medium cursor-help"
                  title={`${(parseFloat(holder.balance) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 9 })} tokens`}
                >
                  {formatBalance(holder.balance)}
                </span>
              </div>

              {/* Percentage */}
              <div className="col-span-3 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(holder.percent / 1e6, 100)}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium min-w-[60px] text-right">
                    {(holder.percent / 1e6).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 border-t border-gray-700 px-4 py-2 bg-[#111214]">
        <div className="text-xs text-gray-400">
          Total holders: {data?.total || 0} {data?.pagination.has_more ? '(showing top 50)' : ''}
        </div>
      </div>
    </div>
  );
});

export default HoldersTab;