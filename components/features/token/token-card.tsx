import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/formatters";

export interface TokenData {
  logo: string;
  ticker: string;
  name: string;
  age: string;
  marketCap: string;
  athMarketCap: string;
  liquidity: string;
  volume: string | number;
  transactions: number;
  holders: string;
  totalFees: string;
  tokenInfo: {
    insightX: string;
    DS: string;
    insidersHold: string;
    bundlesHold: string;
    phishingHold: string;
    snipersHold: string;
    dexPaid: string;
  };
  progress: number;
  tags?: string[];
  isLive?: boolean;
  isDexScreener?: boolean;
  holderPercentages?: {
    dev: string;
    top: string;
  };
  // Add address for navigation
  address?: string;
}

interface TokenCardProps {
  token: TokenData;
}

export default function TokenCard({ token }: TokenCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (token.address) {
      router.push(`/token/${token.address}`);
    }
  };

  // Format volume properly - if it's a number (lamports), convert to SOL and format
  const displayVolume = typeof token.volume === 'string' 
    ? token.volume 
    : formatNumber((token.volume as number) / 1e9);

  return (
    <Card 
      className="h-[70px] hover-elevate active-elevate-2 cursor-pointer rounded-none border-x-0 border-t-0 border-b-gray-700" 
      style={{ backgroundColor: 'rgb(12, 12, 15)' }} 
      data-testid={`card-token-${token.ticker}`}
      onClick={handleClick}
    >
      <div className="h-full flex items-center gap-1">
        {/* Token/Age section - 25% */}
        <div className="flex-[0_0_25%] px-3 flex items-center gap-2">
          <div className="h-[50px] w-[50px] shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center" data-testid={`img-token-logo-${token.ticker}`}>
            <img
              src={token.logo}
              alt={token.name}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.textContent = token.ticker.slice(0, 2);
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm leading-none truncate" data-testid={`text-token-name-${token.ticker}`}>
                {token.name}
              </h3>
              <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0 h-3.5" data-testid={`badge-age-${token.ticker}`}>
                {token.age}
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase truncate" data-testid={`text-ticker-${token.ticker}`}>
              {token.ticker}
            </p>
          </div>
        </div>

        <div className="flex-[0_0_7%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-market-cap">{token.marketCap}</span>
        </div>

        <div className="flex-[0_0_7%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-ath-market-cap">{token.athMarketCap}</span>
        </div>

        <div className="flex-[0_0_7%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-liquidity">{token.liquidity}</span>
        </div>

        <div className="flex-[0_0_7.5%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-volume">{displayVolume}</span>
        </div>

        <div className="flex-[0_0_7%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-transactions">{token.transactions}</span>
        </div>

        <div className="flex-[0_0_7%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-holders">{token.holders}</span>
        </div>

        <div className="flex-[0_0_6%] px-1">
          <span className="font-mono font-medium text-[11px]" data-testid="text-total-fees">{token.totalFees}</span>
        </div>

        {/* Token Info - 26% */}
        <div className="flex-[0_0_26%] px-1 flex items-center gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.insightX}</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.DS}</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.insidersHold}</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.bundlesHold}</Badge>
            </div>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.phishingHold}</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.snipersHold}</Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{token.tokenInfo.dexPaid}</Badge>
            </div>
          </div>
          <Button size="sm" className="shrink-0 h-6 text-xs font-semibold px-3" data-testid="button-buy">
            Buy
          </Button>
        </div>
      </div>
    </Card>
  );
}
