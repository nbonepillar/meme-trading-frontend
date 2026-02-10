'use client';

import { useState, useEffect } from 'react';
import { useTransactionsStore } from '@/store/transactionsStore';
import { useTokenDetailContext } from '../TokenDetailContext';
import { formatTransactionAmountK, calculateTransactionUSDSimple, formatTradeMarketCap } from '@/lib/formatters';
import { useUIStore } from '@/store/uiStore';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

export function TradesTab() {
  const [sortBy, setSortBy] = useState<string>('age');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Get transactions from store
  const transactions = useTransactionsStore((state) => state.transactions);
  const isConnected = useTransactionsStore((state) => state.isConnected);
  
  // Get token data for market cap
  const { tokenData } = useTokenDetailContext();
  
  // Get selected chain ID
  const { selectedChainId } = useUIStore();
  
  // Debug: Log connection status and transactions
  useEffect(() => {
    console.log('[TradesTab] 🔍 DEBUG INFO:');
    console.log('[TradesTab] - Connection status:', isConnected);
    console.log('[TradesTab] - Transactions count:', transactions.length);
    console.log('[TradesTab] - Token data:', tokenData?.address);
    if (transactions.length > 0) {
      console.log('[TradesTab] - First 3 transactions:', transactions.slice(0, 3));
    } else {
      console.log('[TradesTab] - ⚠️ No transactions in store!');
    }
  }, [isConnected, transactions, tokenData]);
  
  // Update current time every 30 seconds to refresh ages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Transform transactions to TradeData format with dynamic age calculation
  const trades = transactions.map(tx => {
    const displayAddress = `${tx.from.slice(0, 4)}...${tx.from.slice(-4)}`;
    
    // Calculate age dynamically based on current time
    const ageMs = currentTime - (tx.timestamp * 1000);
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);
    
    let age: string;
    if (ageDays > 0) {
      age = `${ageDays}d`;
    } else if (ageHours > 0) {
      age = `${ageHours}h`;
    } else if (ageMinutes > 0) {
      age = `${ageMinutes}m`;
    } else {
      age = 'now';
    }
    
    // Debug log to check data
    if (process.env.NODE_ENV === 'development') {
      console.log('[TradesTab] Transaction data:', {
        id: tx.id,
        amountToken: tx.amountToken,
        amountNative: tx.amountNative,
        amount: tx.amount,
        price: tx.price,
        hasAmountToken: tx.amountToken !== undefined && tx.amountToken !== null,
        hasAmountNative: tx.amountNative !== undefined && tx.amountNative !== null
      });
    }
    
    // Format amount based on chain
    let formattedAmount: string;
    if (selectedChainId === 0) {
      // BNB: Use backend value directly, just add K/M suffix
      const amountValue = tx.amountToken !== undefined && tx.amountToken !== null ? tx.amountToken : tx.amount;
      if (amountValue >= 1000000) {
        formattedAmount = `${(amountValue / 1000000).toFixed(1)}M`;
      } else if (amountValue >= 1000) {
        formattedAmount = `${(amountValue / 1000).toFixed(1)}K`;
      } else {
        formattedAmount = `${amountValue.toFixed(2)}`;
      }
    } else {
      // SOL: Use existing logic
      formattedAmount = (tx.amountToken !== undefined && tx.amountToken !== null) 
        ? formatTransactionAmountK(tx.amountToken) 
        : `${tx.amount.toFixed(2)}`;
    }
    
    // Calculate price and total based on chain
    let priceValue: number;
    let totalValue: number;

    if (selectedChainId === 0) {
      // BNB: price = tx.price, total = amount * price * 630
      priceValue = tx.price * 1000;
      const amountValue = tx.amountToken !== undefined && tx.amountToken !== null ? tx.amountToken : tx.amount;
      totalValue = amountValue * tx.price * 630;
    } else {
      // SOL: price = amountNative / amountToken, total = amountNative / 1e9
      priceValue = (tx.amountNative !== undefined && tx.amountNative !== null && tx.amountToken !== undefined && tx.amountToken !== null)
        ? (tx.amountNative / tx.amountToken)
        : tx.price;
      totalValue = (tx.amountNative !== undefined && tx.amountNative !== null)
        ? calculateTransactionUSDSimple(tx.amountNative) 
        : tx.price;
    }
    
    // Get explorer URL based on chain
    const explorerUrl = selectedChainId === 0 
      ? `https://bscscan.com/tx/${tx.txHash}`
      : `https://solscan.io/tx/${tx.txHash}`;
    
    return {
      id: tx.id,
      age: age,
      type: tx.type === 'buy' ? 'Buy' : 'Sell',
      mcap: formatTradeMarketCap(tx.mc),
      amount: formattedAmount,
      totalValue: totalValue.toFixed(5),
      priceValue: priceValue.toFixed(5),
      trader: {
        address: tx.from,
        displayAddress,
        badges: [],
        count: 1
      },
      txHash: tx.txHash || tx.id,
      explorerUrl: explorerUrl
    };
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-[400px]">
      {/* Table Header */}
      <div className="flex items-center px-2 py-2 text-gray-400 text-xs font-medium border-b border-gray-700">
        {/* Age Column */}
        <div className="flex items-center gap-1 w-[16%] px-2">
          <button 
            onClick={() => handleSort('age')}
            className="flex items-center gap-1 cursor-pointer hover:text-gray-300"
          >
            <span>Age</span>
          </button>
        </div>

        {/* Type Column */}
        <div className="flex items-center gap-1 w-[10%] px-2">
          <span>Type</span>
        </div>

        {/* MC Column */}
        <div className="flex items-center gap-1 w-[13%] px-2">
          <div className="flex items-center gap-1 cursor-pointer hover:text-white">
            <span>Price</span>
          </div>
        </div>

        {/* Amount Column */}
        <div className="flex items-center w-[13%] px-2">
          <span>Amount</span>
        </div>

        {/* Total USD Column */}
        <div className="flex items-center gap-1 w-[18%] px-2">
          <div className="flex items-center gap-1">
            <span>Total</span>
          </div>
        </div>

        {/* Trader Column */}
        <div className="flex items-center justify-end gap-2 w-[30%] pr-15">
          <div className="flex items-center gap-1 cursor-pointer hover:text-white">
            <span>Trader</span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-auto" style={{ height: '724px' }}>
        {!isConnected && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Connecting to transaction feed...</div>
            </div>
          </div>
        )}
        
        {isConnected && trades.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">No transactions yet</div>
              <div className="text-gray-500 text-sm">Waiting for new transactions...</div>
            </div>
          </div>
        )}
        
        {trades.map((trade, index) => (
          <div 
            key={trade.id} 
            className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-700/50 ${
              index % 2 === 0 ? '' : 'bg-gray-800/30'
            }`}
            style={{ 
              height: '40px',
              backgroundColor: index % 2 === 0 ? 'rgb(17, 18, 20)' : 'rgba(39, 40, 46, 0.3)'
            }}
          >
            {/* Age */}
            <div className="flex items-center w-[16%] px-2">
              <a 
                href={trade.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 text-xs hover:underline"
              >
                {trade.age}
              </a>
            </div>

            {/* Type */}
            <div className="flex items-center w-[10%] px-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                trade.type === 'Buy' 
                  ? '' 
                  : ''
              }`} style={{ 
                color: trade.type === 'Buy' ? 'rgb(134, 217, 159)' : 'rgb(242, 102, 130)'
              }}>
                {trade.type}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center w-[13%] px-2">
              <span className="text-gray-300 text-xs">
                $<PriceDisplay 
                  price={trade.priceValue} 
                  chainId={selectedChainId}
                />
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-center w-[13%] px-2">
              <span className="text-gray-300 text-xs">{trade.amount}</span>
            </div>

            {/* Total USD */}
            <div className="flex items-center w-[18%] px-2 relative">
              <div 
                className="absolute left-2 right-0 top-0 bottom-0 pointer-events-none"
              ></div>
              <span className="text-gray-300 text-xs relative z-10">
                $<PriceDisplay 
                  price={trade.totalValue} 
                  chainId={selectedChainId}
                />
              </span>
            </div>

            {/* Trader */}
            <div className="flex items-center justify-end w-[30%] px-2">
              <div className="flex items-center gap-2">
                <a 
                  href={`/sol/address/${trade.trader.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">
                      {trade.trader.displayAddress}
                    </span>
                    <button className="flex items-center justify-center cursor-pointer text-gray-400 hover:text-white">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                        <path d="m10.2104 3.7423 1.9922 1.9922.9405-.9405c.5501-.5501.5508-1.442.0007-1.9922s-1.4428-.5501-1.9929 0zm-.5338 10.9705a.7003.7003 0 0 1-.7002-.7002.7007.7007 0 0 1 .7002-.7002l4.8082.0007a.7003.7003 0 0 1 .7002.7002.6997.6997 0 0 1-.6995.6995zm-6.5663-3.8704a.3.3 0 0 0-.0787.1381l-.6318 2.4714 2.568-.5504a.3.3 0 0 0 .1492-.0814l6.0954-6.0954-1.9922-1.9922zm7.0511-9.0301c1.0968-1.0969 2.8751-1.0969 3.9719 0s1.0969 2.875 0 3.972l-8.026 8.026a1.7 1.7 0 0 1-.846.4606l-3.3566.7188-.1216.018c-.5606.0444-1.0281-.4422-.9619-1.0006l.0228-.1209.8314-3.2524a1.7 1.7 0 0 1 .4454-.781z"/>
                      </svg>
                    </button>
                  </div>
                </a>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-2 ml-2">
                <button className="flex items-center justify-center cursor-pointer text-gray-400 hover:text-white">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M9.5867 11.9519V9.1355c0-.4165.153-.8187.4297-1.1299l3.7226-4.1865a.3.3 0 0 0 .0762-.1992v-.8252a.3005.3005 0 0 0-.3008-.2998H2.4861a.2997.2997 0 0 0-.2998.2998v.8261c0 .0734.0265.1444.0752.1993l3.7158 4.1865c.2758.311.4276.7123.4277 1.128v4.8105a.0999.0999 0 0 0 .1533.084l2.8887-1.8233a.301.301 0 0 0 .1397-.2539m5.6279-8.332c0 .4165-.1529.8186-.4297 1.1299l-3.7226 4.1865a.3.3 0 0 0-.0762.1992v2.8164c0 .5833-.2989 1.126-.792 1.4375l-2.8877 1.8242c-.9988.6306-2.3007-.0873-2.3008-1.2685V9.1345a.3.3 0 0 0-.0762-.1982L1.2146 4.7488a1.7 1.7 0 0 1-.4287-1.128v-.8261c0-.939.7613-1.7002 1.7002-1.7002h11.0283c.9389 0 1.7002.7613 1.7002 1.7002z"/>
                  </svg>
                </button>
                <a 
                  href={trade.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center cursor-pointer text-gray-400 hover:text-white"
                  title={selectedChainId === 0 ? 'View on BscScan' : 'View on Solscan'}
                >
                  {selectedChainId === 0 ? (
                    // BscScan icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" className="text-gray-400">
                      <path fill="currentColor" fillOpacity="0.7" d="M3.3319 7.6083c0-.3692.3033-.6726.672-.6726h1.1334c.3692 0 .6854.3034.6854.686v4.2745q.1976-.0596.4748-.119c.2503-.0659.4352-.2899.4352-.5543V5.9194c0-.3692.3034-.686.6854-.686h1.1335c.3692 0 .6854.3033.6854.686v4.9215s.277-.1191.5536-.2375c.2112-.0921.343-.2899.343-.5279V4.2049c0-.3692.3033-.686.6726-.686h1.1334c.3693 0 .6726.3033.6726.686V9.047c.9754-.7123 1.9776-1.5699 2.7686-2.599.2374-.3033.3033-.6994.1715-1.0687C14.1021 1.2105 9.5416-1.0064 5.376.445 1.2103 1.8965-1.004 6.461.4456 10.6303c.158.4749.3692.9235.6195 1.3587.1977.343.567.5408.9625.5011.2112-.0134.4749-.0397.8038-.0793.29-.0263.5011-.2772.5011-.5677z"></path>
                      <path fill="currentColor" fillOpacity="0.5" d="M3.3052 14.4687c3.5723 2.599 8.5687 1.8073 11.1651-1.7676.9887-1.3721 1.5289-3.0213 1.5289-4.7096 0-.185-.0135-.3693-.0263-.5542-2.9125 4.3666-8.3043 6.4113-12.6677 7.0314"></path>
                    </svg>
                  ) : (
                    // Solscan icon
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 20c5.5228 0 10-4.4772 10-10S15.5228 0 10 0 0 4.4772 0 10s4.4772 10 10 10M6.4648 5.5012c-.0982 0-.1935.0404-.2657.1097L4.3887 7.4213c-.1184.1184-.0346.3205.1329.3205h9.1645a.376.376 0 0 0 .2657-.1097l1.8104-1.8104c.1184-.1184.0346-.3205-.1329-.3205zm0 6.7578a.376.376 0 0 0-.2657.1098l-1.8104 1.8103c-.1184.1184-.0346.3205.1329.3205h9.1645a.376.376 0 0 0 .2657-.1097l1.8104-1.8104c.1184-.1183.0346-.3205-.1329-.3205zm7.487-3.2887a.376.376 0 0 0-.2657-.1097H4.5216c-.1675 0-.2513.2021-.1329.3205l1.8104 1.8104a.376.376 0 0 0 .2657.1097h9.1645c.1675 0 .2513-.2021.1329-.3205z" clipRule="evenodd"/>
                    </svg>
                  )}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
