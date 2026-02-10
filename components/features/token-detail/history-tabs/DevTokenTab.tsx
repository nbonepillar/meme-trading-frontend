'use client';

import { memo } from 'react';

const DevTokenTab = memo(function DevTokenTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-2">Dev Token</div>
        <div className="text-sm text-gray-500">Dev token data will be displayed here</div>
      </div>
    </div>
  );
});

export default DevTokenTab;