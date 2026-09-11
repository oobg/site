import './globals.css';
import { sans, mono } from '@styles/fonts';
import { ProductionGoogleAnalytics } from '@components/analytics/ProductionGoogleAnalytics';
import { AppProviders } from '@components/providers/AppProviders';
import { INTRO_STORAGE_KEY } from '@components/intro/introState';
import { baseMetadata } from '@lib/metadata/metadata';
import { buildSiteStructuredData, serializeJsonLd } from '@lib/metadata/structured-data';
import { PublicChrome } from '@/app/_components/PublicChrome';
import styles from './layout.module.css';

export const metadata = baseMetadata;

const introBootScript = `try{var k=${JSON.stringify(INTRO_STORAGE_KEY)};if(sessionStorage.getItem(k)||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='shown';sessionStorage.setItem(k,'1');}else{document.documentElement.dataset.intro='pending';sessionStorage.setItem(k,'1');}}catch(e){document.documentElement.dataset.intro='shown';}setTimeout(function(){if(document.documentElement.dataset.intro==='pending')document.documentElement.dataset.intro='shown';},5000);document.addEventListener('keydown',function(e){if(document.documentElement.dataset.intro==='pending'&&e.key==='Tab')e.preventDefault();},true);window.__ravenAdminPopGuard=null;window.addEventListener('popstate',function(e){if(typeof window.__ravenAdminPopGuard==='function')window.__ravenAdminPopGuard(e);},true);`;

const googleAnalyticsId =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim()
    : undefined;

const siteStructuredData = serializeJsonLd(buildSiteStructuredData());

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: siteStructuredData }}
        />
        <script dangerouslySetInnerHTML={{ __html: introBootScript }} />
      </head>
      <body>
        <AppProviders>
          <div className={styles.introBackground} data-intro-background>
            <PublicChrome>{children}</PublicChrome>
          </div>
        </AppProviders>
        {googleAnalyticsId ? <ProductionGoogleAnalytics measurementId={googleAnalyticsId} /> : null}
      </body>
    </html>
  );
}
