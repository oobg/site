import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@styles/fonts', () => ({
  sans: { variable: 'sans' },
  mono: { variable: 'mono' },
}));
vi.mock('@components/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@components/analytics/ProductionGoogleAnalytics', () => ({
  ProductionGoogleAnalytics: () => null,
}));
vi.mock('@/app/_components/PublicChrome', () => ({
  PublicChrome: ({ children }: { children: React.ReactNode }) => children,
}));

import RootLayout from '@/app/layout';

describe('RootLayout', () => {
  it('모든 공개 화면에 WebSite·Person 그래프를 싣는다', () => {
    const html = renderToStaticMarkup(<RootLayout>본문</RootLayout>);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? '') as { '@graph': Record<string, unknown>[] };

    expect(data['@graph']).toEqual([
      expect.objectContaining({
        '@type': 'WebSite',
        '@id': 'https://raven.kr/#website',
        url: 'https://raven.kr/',
        name: 'raven.kr',
        author: { '@id': 'https://raven.kr/#author' },
      }),
      expect.objectContaining({
        '@type': 'Person',
        '@id': 'https://raven.kr/#author',
        name: 'Raven',
      }),
    ]);
  });
});
