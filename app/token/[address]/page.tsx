// app/token/[address]/page.tsx
import { Suspense } from 'react';
import MainLayout from '@/components/common/layout/main-layout';
import TokenDetailContainer from '@/components/features/token-detail/TokenDetailContainer';
import TokenDetailSkeleton from '@/components/features/token-detail/TokenDetailSkeleton';

interface TokenDetailPageProps {
  params: Promise<{
    address: string;
  }>;
  searchParams: Promise<{
    chainId?: string;
    symbol?: string;
    name?: string;
    image?: string;
  }>;
}

export default async function TokenDetailPage({ params, searchParams }: TokenDetailPageProps) {
  const { address } = await params;
  const search = await searchParams;

  if (!address || address.trim().length === 0) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Token Address</h1>
            <p className="text-gray-400">Please provide a valid token address</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <Suspense fallback={<TokenDetailSkeleton />}>
        <TokenDetailContainer 
          tokenAddress={address}
          initialChainId={search.chainId}
          initialSymbol={search.symbol}
          initialName={search.name}
          initialImage={search.image}
        />
      </Suspense>
    </MainLayout>
  );
}

export async function generateMetadata({ params }: TokenDetailPageProps) {
  const { address } = await params;
  
  const title = `Token ${address}`;
  
  return {
    title: `${title} - Meme Trading`,
    description: `View detailed information for token ${address}`,
  };
}
