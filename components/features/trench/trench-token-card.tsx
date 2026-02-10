import { memo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import TokenAvatar from "@/components/features/token/token-avatar";
import TokenName from "@/components/features/token/token-name";
import TokenSocial from "@/components/features/token/token-social";
import TokenInfo from "@/components/features/token/token-info";
import TokenButtons from "@/components/features/token/token-buttons";
import TokenTimer from "@/components/features/token/token-timer";

export interface TrenchTokenData {
  category: 'new' | 'almost_bonded' | 'migrated';
  avatar?: string;
  imageUrl?: string;
  tokenAddress: string;
  coinName?: string;
  name?: string;
  symbol: string;
  volume?: number;
  volume24h?: number;
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  transactionCount: {
    buy: number;
    sell: number;
  };
  fee: string;
  metainfo: {
    telegram: string | null;
    x: string | null;
  };
  traderCount: number;
  migratedPercent?: number;
  bondingCurveProgress?: number;
  timestamp: number;
  createdAt?: string;
}

interface TrenchTokenCardProps {
  token: TrenchTokenData;
}

const TrenchTokenCard = memo(({ token }: TrenchTokenCardProps) => {
  const router = useRouter();
  const displayName = token.coinName || token.name || token.symbol;
  const displayImage = token.avatar || token.imageUrl || '';
  // Convert volume from lamports to SOL (divide by 10^9)
  const displayVolume = (token.volume || token.volume24h || 0) / 1e9;

  const handleClick = () => {
    // Navigate to token detail page with just the address
    // All data will be fetched from backend via WebSocket
    console.log('[TrenchTokenCard] Navigating to token:', {
      tokenAddress: token.tokenAddress,
      symbol: token.symbol,
      name: displayName,
      timestamp: token.timestamp
    });
    router.push(`/token/${token.tokenAddress}`);
  };

  return (
    <Card 
      className="px-3 py-2 hover-elevate active-elevate-2 cursor-pointer rounded-none border-x-0 border-t-0 border-b-gray-700" 
      data-testid={`trench-card-token-${token.symbol}`} 
      style={{ contain: 'layout style paint', backgroundColor: 'rgb(12, 12, 15)' }}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <TokenAvatar
            imageUrl={displayImage}
            name={displayName}
            symbol={token.symbol}
            address={token.tokenAddress}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <TokenName name={displayName} symbol={token.symbol} />
            <TokenInfo
              price={token.price || 0}
              priceChange24h={token.priceChange24h}
              buyCount={token.transactionCount.buy}
              sellCount={token.transactionCount.sell}
              volume={displayVolume * 85}
              marketCap={token.marketCap}
            />
          </div>

          <div className="flex items-center gap-2">
            <TokenTimer
              timestamp={token.timestamp}
              symbol={token.symbol}
              tokenAddress={token.tokenAddress}
            />
            <TokenSocial
              xUrl={token.metainfo.x}
              telegramUrl={token.metainfo.telegram}
            />
          </div>

          <TokenButtons tokenAddress={token.tokenAddress} />
        </div>
      </div>
    </Card>
  );
});

TrenchTokenCard.displayName = "TrenchTokenCard";

export default TrenchTokenCard;
