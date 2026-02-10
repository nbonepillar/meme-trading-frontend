import { memo, useMemo } from "react";
import { formatPrice, formatNumber, formatMarketCapDisplay, formatPriceGmgn } from "@/lib/formatters";

interface TokenInfoProps {
  price: number;
  priceChange24h?: number;
  buyCount: number;
  sellCount: number;
  volume: number;
  marketCap?: number;
}

const TokenInfo = memo(({ price, priceChange24h, buyCount, sellCount, volume, marketCap }: TokenInfoProps) => {
  const { totalTx, buyPercentage, sellPercentage } = useMemo(() => {
    const total = buyCount + sellCount;
    return {
      totalTx: total,
      buyPercentage: total > 0 ? (buyCount / total) * 100 : 50,
      sellPercentage: total > 0 ? (sellCount / total) * 100 : 50,
    };
  }, [buyCount, sellCount]);

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono">V<span className="text-green-500">${formatNumber(volume)}</span></span>
        <span className="text-[11px] font-mono">MC<span className="text-blue-500">${formatMarketCapDisplay(marketCap)}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono">
          <span className={priceChange24h && priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
            ${formatPriceGmgn(Number(formatPrice(price)))}
          </span>
        </span>
        <span className="text-[11px] font-mono">TX{totalTx}</span>
        {totalTx === 0 ? (
          <div className="w-[30px] h-[3px] bg-gray-500 rounded-sm" />
        ) : (
          <div className="w-[30px] h-[3px] flex rounded-sm overflow-hidden">
            <div className="bg-green-500" style={{ width: `${buyPercentage}%` }} />
            <div className="bg-red-500" style={{ width: `${sellPercentage}%` }} />
          </div>
        )}
      </div>
    </div>
  );
});

TokenInfo.displayName = "TokenInfo";

export default TokenInfo;
