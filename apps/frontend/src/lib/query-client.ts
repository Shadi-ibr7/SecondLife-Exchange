'use client';

import { QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  // For SSR, always make a new query client
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  // For CSR, make a new query client if we don't already have one
  // This is very important so we don't share state between users in SSR
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

