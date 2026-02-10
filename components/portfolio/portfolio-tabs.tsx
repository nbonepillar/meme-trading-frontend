"use client";

import { useState } from 'react';
import { Settings } from 'lucide-react';
import HoldingsContent from './holdings-content';
import HistoryContent from './history-content';

export default function PortfolioTabs() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tab List */}
                <div className="border-b border-solid border-custom-border h-[48px] flex items-center justify-between flex-shrink-0" role="tablist">
                    {/* Tab Buttons */}
                    <div className="flex">
                        <button 
                            className={`h-[47px] text-[14px] font-medium border-b-[2px] border-solid px-4 ${
                                activeTab === 0 
                                    ? 'border-white text-white' 
                                    : 'border-transparent text-second-font-color hover:text-gray-300'
                            }`}
                            type="button" 
                            onClick={() => setActiveTab(0)}
                            role="tab"
                            aria-selected={activeTab === 0}
                        >
                            Holding
                        </button>
                        <button 
                            className={`h-[47px] text-[14px] font-medium border-b-[2px] border-solid px-4 ${
                                activeTab === 1 
                                    ? 'border-white text-white' 
                                    : 'border-transparent text-second-font-color hover:text-gray-300'
                            }`}
                            type="button" 
                            onClick={() => setActiveTab(1)}
                            role="tab"
                            aria-selected={activeTab === 1}
                        >
                            History
                        </button>
                    </div>
                </div>

                {/* Tab Panels */}
                <div className="flex-1 overflow-hidden">
                    {/* Holding Tab */}
                    {activeTab === 0 && (
                        <div className="holding-table h-full overflow-auto" role="tabpanel">
                            <HoldingsContent />
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 1 && (
                        <div role="tabpanel" className="h-full overflow-auto">
                            <HistoryContent />
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 2 && (
                        <div role="tabpanel" className="h-full flex items-center justify-center">
                            <div className="text-second-font-color">Orders content will be implemented here</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}