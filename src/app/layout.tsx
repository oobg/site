import './globals.css';
import { sans, mono } from '@styles/fonts';
import { AppProviders } from '@components/providers/AppProviders';
import { baseMetadata } from '@lib/metadata/metadata';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { INTRO_STORAGE_KEY } from '@components/intro/introState';

export const metadata = baseMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {/* 페인트 전 동기 실행: 최초 진입이면 html[data-intro]=pending, 아니면 shown.
            pending이면 즉시 기록해 새로고침 반복 재생을 막는다(세션당 1회). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var k=${JSON.stringify(INTRO_STORAGE_KEY)};if(sessionStorage.getItem(k)){document.documentElement.dataset.intro='shown';}else{document.documentElement.dataset.intro='pending';sessionStorage.setItem(k,'1');}}catch(e){document.documentElement.dataset.intro='shown';}`,
          }}
        />
        <AppProviders>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
