import { memo } from "react";

interface TokenNameProps {
  name: string;
  symbol: string;
}

const TokenName = memo(({ name, symbol }: TokenNameProps) => {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <h3 className="font-semibold text-base leading-none truncate" data-testid={`text-token-name-${symbol}`}>
        {name}
      </h3>
      <span className="text-sm text-muted-foreground font-mono" data-testid={`text-ticker-${symbol}`}>
        {symbol}
      </span>
    </div>
  );
});

TokenName.displayName = "TokenName";

export default TokenName;
