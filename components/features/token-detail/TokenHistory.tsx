'use client';

import { useState } from 'react';
import { TradesTab } from './history-tabs/TradesTab';
import PositionsTab from './history-tabs/PositionsTab';
import HoldersTab from './history-tabs/HoldersTab';

const tabs = [
  { id: 'trades', label: 'Trades', hasDropdown: true },
  { id: 'positions', label: 'Positions', hasDropdown: false },
  { id: 'holders', label: 'Holders', hasDropdown: false },
];

export function TokenHistory() {
  const [activeTab, setActiveTab] = useState('trades');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trades':
        return <TradesTab />;
      case 'positions':
        return <PositionsTab />;
      case 'holders':
        return <HoldersTab />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-400">
            {tabs.find(tab => tab.id === activeTab)?.label} content coming soon...
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between px-4">
          <div className="flex">
            {tabs.map((tab) => (
              <div key={tab.id} className="relative">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}