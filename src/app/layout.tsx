import './globals.css';
import { sans, mono } from '@styles/fonts';
import { AppProviders } from '@components/providers/AppProviders';
import { baseMetadata } from '@lib/metadata/metadata';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';

export const metadata = baseMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <AppProviders>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
