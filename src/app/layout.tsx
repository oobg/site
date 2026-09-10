import './globals.css';
import { sans, mono } from '@styles/fonts';
import { AppProviders } from '@components/providers/AppProviders';
import { INTRO_STORAGE_KEY } from '@components/intro/introState';
import { baseMetadata } from '@lib/metadata/metadata';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import styles from './layout.module.css';

export const metadata = baseMetadata;

const introBootScript = `try{var k=${JSON.stringify(INTRO_STORAGE_KEY)};if(sessionStorage.getItem(k)||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='shown';sessionStorage.setItem(k,'1');}else{document.documentElement.dataset.intro='pending';sessionStorage.setItem(k,'1');}}catch(e){document.documentElement.dataset.intro='shown';}setTimeout(function(){if(document.documentElement.dataset.intro==='pending')document.documentElement.dataset.intro='shown';},5000);document.addEventListener('keydown',function(e){if(document.documentElement.dataset.intro==='pending'&&e.key==='Tab')e.preventDefault();},true);window.__ravenAdminPopGuard=null;window.addEventListener('popstate',function(e){if(typeof window.__ravenAdminPopGuard==='function')window.__ravenAdminPopGuard(e);},true);`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introBootScript }} />
      </head>
      <body>
        <AppProviders>
          <div className={styles.introBackground} data-intro-background>
            {/* 헤더보다 먼저 온다 — 탭 순서에서 첫 번째여야 건너뛸 것이 남는다. */}
            <a className={styles.skip} href="#main">
              본문으로 건너뛰기
            </a>
            <SiteHeader />
            <main id="main" className={styles.main}>
              {children}
            </main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
