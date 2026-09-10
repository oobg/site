import './globals.css';
import { sans, mono } from '@styles/fonts';
import { AppProviders } from '@components/providers/AppProviders';
import { baseMetadata } from '@lib/metadata/metadata';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import styles from './layout.module.css';

export const metadata = baseMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        <AppProviders>
          {/* 헤더보다 먼저 온다 — 탭 순서에서 첫 번째여야 건너뛸 것이 남는다. */}
          <a className={styles.skip} href="#main">
            본문으로 건너뛰기
          </a>
          <SiteHeader />
          <main id="main" className={styles.main}>
            {children}
          </main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
