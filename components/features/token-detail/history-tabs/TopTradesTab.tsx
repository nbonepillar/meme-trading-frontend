'use client';

import { memo } from 'react';

const TopTradesTab = memo(function TopTradesTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-2">Top Trades</div>
        <div className="text-sm text-gray-500">Top trades data will be displayed here</div>
      </div>
    </div>
  );
});

export default TopTradesTab;