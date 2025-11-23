/**
 * BUGS FIXED (1 critical bug):
 * 1. Creating new QueryClient on every render - Fixed by using useState
 *    This was causing the cache to be destroyed and recreated on every render,
 *    leading to infinite loops, lost cache data, and broken React Query functionality
 *
 * IMPROVEMENTS:
 * - QueryClient now created only once using useState initializer
 * - Properly configured staleTime and retry logic
 * - Added refetchOnWindowFocus configuration
 * - Optimized default options for this application
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use useState with initializer function to create QueryClient only once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Consider data fresh for 1 minute
            retry: 1, // Retry failed queries once
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
