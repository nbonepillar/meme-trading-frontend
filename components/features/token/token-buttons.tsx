import { memo } from "react";
import { Users, Wallet, Layers, Copy, Search, Zap } from "lucide-react";
import { useTokenMetrics } from "@/hooks/useTokenMetrics";
import { useUIStore } from "@/store/uiStore";

interface TokenButtonsProps {
  tokenAddress?: string;
}

const TokenButtons = memo(({ tokenAddress }: TokenButtonsProps) => {
  const { tokenMetrics, isConnected } = useTokenMetrics(tokenAddress);
  const quickBuyAmount = useUIStore((state) => state.quickBuyAmount);

  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono hover:bg-gray-700/20 rounded-[5px] transition-colors"
          style={{ border: '1px solid rgb(39, 40, 46)' }}
          onClick={(e) => e.stopPropagation()}
          title="Holders"
        >
          <Users className="w-4 h-4" />
          <span className="text-green-500">{tokenMetrics.holders}</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono hover:bg-gray-700/20 rounded-[5px] transition-colors"
          style={{ border: '1px solid rgb(39, 40, 46)' }}
          onClick={(e) => e.stopPropagation()}
          title="Dev Holdings"
        >
          <Wallet className="w-4 h-4" />
          <span className="text-green-500">{tokenMetrics.dev.toFixed(1)}%</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono hover:bg-gray-700/20 rounded-[5px] transition-colors"
          style={{ border: '1px solid rgb(39, 40, 46)' }}
          onClick={(e) => e.stopPropagation()}
          title="Top 10 Holdings"
        >
          <Layers className="w-4 h-4" />
          <span className="text-green-500">{tokenMetrics.top10.toFixed(1)}%</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono hover:bg-gray-700/20 rounded-[5px] transition-colors"
          style={{ border: '1px solid rgb(39, 40, 46)' }}
          onClick={(e) => e.stopPropagation()}
          title="Snipers"
        >
          <Copy className="w-4 h-4" />
          <span className="text-green-500">{tokenMetrics.snipers.toFixed(1)}%</span>
        </button>
      </div>

      <button
        type="button"
        className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono bg-gray-800/50 text-green-400 hover:bg-green-500 hover:text-black rounded-[4px] transition-all duration-200 shrink-0 border border-[rgb(39,40,46)] hover:border-[rgb(134,217,159)]"
        onClick={(e) => e.stopPropagation()}
        title="Buy"
      >
        <Zap className="w-3 h-3 fill-current" />
        <span>{quickBuyAmount ? `${quickBuyAmount}Buy` : 'Buy'}</span>
      </button>
    </div>
  );
});

TokenButtons.displayName = "TokenButtons";

export default TokenButtons;
