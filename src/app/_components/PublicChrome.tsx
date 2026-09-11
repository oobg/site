'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import styles from '@/app/layout.module.css';

export function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return children;

  return (
    <>
      <a className={styles.skip} href="#main">
        본문으로 건너뛰기
      </a>
      <SiteHeader />
      <main id="main" className={styles.main}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
