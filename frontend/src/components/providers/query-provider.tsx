'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors except 401
              const errorObj = error as { response?: { status?: number } };
              if (errorObj?.response?.status && errorObj.response.status >= 400 && errorObj.response.status < 500) {
                return errorObj.response.status === 401 ? false : false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: (failureCount, error: unknown) => {
              // Don't retry mutations on client errors
              const errorObj = error as { response?: { status?: number } };
              if (errorObj?.response?.status && errorObj.response.status >= 400 && errorObj.response.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 