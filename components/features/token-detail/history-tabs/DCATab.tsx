'use client';

import { memo } from 'react';

const DCATab = memo(function DCATab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-2">DCA</div>
        <div className="text-sm text-gray-500">DCA data will be displayed here</div>
      </div>
    </div>
  );
});

export default DCATab;