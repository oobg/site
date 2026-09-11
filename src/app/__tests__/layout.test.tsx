import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@styles/fonts', () => ({ sans: { variable: 'sans' }, mono: { variable: 'mono' } }));
vi.mock('@components/analytics/ProductionGoogleAnalytics', () => ({
  ProductionGoogleAnalytics: () => null,
}));
vi.mock('@components/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/app/_components/PublicChrome', () => ({
  PublicChrome: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

import RootLayout from '@/app/layout';

describe('RootLayout structured data', () => {
  it('정적 HTML에 WebSite와 Raven Person을 함께 내보낸다', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>본문</p>
      </RootLayout>,
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script?.textContent ?? '') as {
      '@graph': Array<Record<string, unknown>>;
    };
    expect(data['@graph']).toEqual([
      expect.objectContaining({
        '@type': 'WebSite',
        '@id': 'https://raven.kr/#website',
        name: 'raven.kr',
      }),
      expect.objectContaining({
        '@type': 'Person',
        '@id': 'https://raven.kr/#author',
        name: 'Raven',
      }),
    ]);
  });
});
