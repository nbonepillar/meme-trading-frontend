'use client';

import { memo } from 'react';

const LiquidityPoolTab = memo(function LiquidityPoolTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-2">Liquidity Pool</div>
        <div className="text-sm text-gray-500">Liquidity pool data will be displayed here</div>
      </div>
    </div>
  );
});

export default LiquidityPoolTab;