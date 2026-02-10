'use client';

import { memo } from 'react';

const TrackingTab = memo(function TrackingTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-2">Tracking</div>
        <div className="text-sm text-gray-500">Tracking data will be displayed here</div>
      </div>
    </div>
  );
});

export default TrackingTab;