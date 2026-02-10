'use client';

import { useState } from 'react';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndicators: string[];
  onIndicatorToggle: (indicator: string) => void;
}

const indicators = [
  {
    id: 'MA5',
    name: 'MA5'
  },
  {
    id: 'MA20',
    name: 'MA20'
  },
  {
    id: 'MA50',
    name: 'MA50'
  },
  {
    id: 'EMA5',
    name: 'EMA5'
  },
  {
    id: 'EMA20',
    name: 'EMA20'
  },
  {
    id: 'EMA50',
    name: 'EMA50'
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands'
  },
  {
    id: 'macd',
    name: 'MACD'
  },
  {
    id: 'rsi',
    name: 'RSI'
  },
  {
    id: 'stochRsi',
    name: 'Stochastic RSI'
  },
  {
    id: 'atr',
    name: 'ATR'
  }
];

export default function IndicatorModal({ isOpen, onClose, selectedIndicators, onIndicatorToggle }: IndicatorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredIndicators = indicators.filter(indicator =>
    indicator.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal */}
      <div className="relative w-[400px] max-h-[500px] rounded-lg shadow-2xl" style={{ backgroundColor: 'rgb(31, 31, 31)', borderColor: 'rgb(74, 74, 74)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottomColor: 'rgb(74, 74, 74)', borderBottomWidth: '1px' }}>
          <h2 className="text-lg font-semibold text-white">Indicators</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4" style={{ borderBottomColor: 'rgb(74, 74, 74)', borderBottomWidth: '1px' }}>
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md text-white placeholder-gray-400 focus:outline-none border-0"
              style={{ backgroundColor: 'rgb(31, 31, 31)' }}
            />
          </div>
        </div>

        {/* Indicator List */}
        <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ backgroundColor: 'rgb(31, 31, 31)' }}>
          {filteredIndicators.map((indicator) => (
            <div
              key={indicator.id}
              className="flex items-center p-4 hover:bg-gray-800/50 cursor-pointer"
              onClick={() => onIndicatorToggle(indicator.id)}
            >
              <div className="flex-1">
                <div className="text-sm text-gray-400 font-medium">{indicator.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}