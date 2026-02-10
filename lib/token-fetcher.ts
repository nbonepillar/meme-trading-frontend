// Server-side only token fetcher (GraphQL)
import { apolloClient } from './apollo-client';
import { GET_INITIAL_TOKENS } from './graphql/queries';
import type { TrenchTokenData } from '@/components/features/trench/trench-token-card';

interface GraphQLToken {
  c: string;           // chainId
  a: string;           // address
  s: string;           // symbol
  n: string;           // name
  i: string;           // image
  ts: string;          // totalSupply
  d: number;           // decimals
  ct: number;          // createdAt
  m: boolean;          // migrated
  sa: string;          // soldAmount
  v: string;           // volume24h
  bs: string;          // bondingStatus
  l: string;           // liquidity
  h: number;           // holders
  t: number;           // transactions24h
  st: number;          // sellTransactions24h
  bt: number;          // buyTransactions24h
  mc: string;          // marketCap
  p: string;           // price
  p24: string;         // priceChange24h
  p7: string;          // priceChange7d
  v24: string;         // volumeChange24h
  l24: string;         // liquidityChange24h
  h24: number;         // holdersChange24h
  cat: string;         // category
}

interface TokensQueryResponse {
  tokens: GraphQLToken[];
}

export async function fetchInitialTokens(): Promise<TrenchTokenData[]> {
  try {
    const { data } = await apolloClient.query<TokensQueryResponse>({
      query: GET_INITIAL_TOKENS,
      variables: {
        input: {
          limit: 100,
        },
      },
      fetchPolicy: 'no-cache',
    });

    if (!data) {
      return [];
    }

    const tokens = data.tokens || [];
    const now = Date.now();

    // Map GraphQL response to TrenchTokenData format
    const validTokens: TrenchTokenData[] = tokens
      .filter((token) => token.cat && token.a)
      .map((token) => ({
        tokenAddress: token.a,
        symbol: token.s,
        name: token.n,
        coinName: token.n,
        imageUrl: token.i,
        avatar: token.i,
        createdAt: token.ct ? String(token.ct) : undefined,
        volume24h: parseFloat(token.v) || 0,
        volume: parseFloat(token.v) || 0,
        transactionCount: {
          buy: token.bt || 0,
          sell: token.st || 0,
        },
        marketCap: parseFloat(token.mc) || 0,
        price: parseFloat(token.p) || 0,
        priceChange24h: parseFloat(token.p24) || 0,
        category: token.cat === 'NEW' ? 'new' : token.cat === 'NEAR_MIGRATE' ? 'almost_bonded' : 'migrated',
        timestamp: token.ct && token.ct > 0 ? token.ct : now,
        fee: '0',
        metainfo: {
          telegram: null,
          x: null,
        },
        traderCount: 0,
      }));

    return validTokens;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch initial tokens from GraphQL:', error);
    }
    return [];
  }
}
