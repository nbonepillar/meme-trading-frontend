import TokenCard, { type TokenData } from "./token-card";

interface TokenGridProps {
  tokens: TokenData[];
}

export default function TokenGrid({ tokens }: TokenGridProps) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden" data-testid="grid-tokens">
      {tokens.map((token, index) => (
        <TokenCard key={index} token={token} />
      ))}
    </div>
  );
}
