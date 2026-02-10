'use client';

import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo-client';

export default function TrenchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
