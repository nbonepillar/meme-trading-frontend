"use client";

import TokenGrid from "@/components/features/token/token-grid";
import { type TokenData } from "@/components/features/token/token-card";

export default function Trending() {

  //todo: remove mock functionality - replace with real API data
  const mockTokens: TokenData[] = Array.from({ length: 14 }, (_, i) => ({
    logo: `/mock-avatar/mockavatar${i + 1}.png`,
    ticker: `ticker${i + 1}`,
    name: `R^NCoin${i + 1}`,
    age: "1m",
    marketCap: "100K",
    athMarketCap: "100K",
    liquidity: "10K",
    volume: "10K",
    transactions: 0,
    holders: "20",
    totalFees: "120",
    tokenInfo: {
      insightX: "20%",
      DS: "DS",
      insidersHold: "0%",
      bundlesHold: "30%",
      phishingHold: "18%",
      snipersHold: "0%",
      dexPaid: "500CTO"
    },
    progress: 0,
    tags: ["TikTok Galaxy"],
    holderPercentages: {
      dev: "50%",
      top: "10%"
    }
  }));

  return <TokenGrid tokens={mockTokens} />;
}
