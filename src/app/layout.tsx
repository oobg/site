import './globals.css';
import Script from 'next/script';
import { sans, mono } from '@styles/fonts';
import { AppProviders } from '@components/providers/AppProviders';
import { baseMetadata } from '@lib/metadata/metadata';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { INTRO_STORAGE_KEY } from '@components/intro/introState';

export const metadata = baseMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        {/* 페인트 전 동기 실행: 최초 진입이면 html[data-intro]=pending, 아니면 shown.
            pending이면 즉시 기록해 새로고침 반복 재생을 막는다(세션당 1회).
            next/script beforeInteractive로 head에 주입 → 오버레이가 파싱되기 전에 data-intro 확정. */}
        <Script id="ppos-intro" strategy="beforeInteractive">
          {`try{var k=${JSON.stringify(INTRO_STORAGE_KEY)};if(sessionStorage.getItem(k)){document.documentElement.dataset.intro='shown';}else{document.documentElement.dataset.intro='pending';sessionStorage.setItem(k,'1');}}catch(e){document.documentElement.dataset.intro='shown';}`}
        </Script>
        <AppProviders>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
