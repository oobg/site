import './globals.css';
import type { Metadata } from 'next';
import { sans, mono } from '@styles/fonts';

export const metadata: Metadata = { title: 'raven.kr' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
