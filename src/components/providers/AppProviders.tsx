'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
// eslint-disable-next-line no-restricted-imports -- Toaster 마운트는 프로바이더에서만
import { Toaster } from 'sonner';
import { makeQueryClient } from '@configs/query-client';
import { IntroProvider } from '@components/intro/IntroProvider';
import { SiteIntro } from '@components/intro/SiteIntro';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <IntroProvider>
        <SiteIntro />
        {children}
        <Toaster position="bottom-right" />
      </IntroProvider>
    </QueryClientProvider>
  );
}
