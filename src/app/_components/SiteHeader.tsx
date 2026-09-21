'use client';

import Link from 'next/link';
import { CommandPalette } from '@/app/_container/CommandPalette';
import { ROUTES } from '@constants/routes';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <nav className={styles.pill} aria-label="주요 내비게이션">
          <Link href={ROUTES.HOME} className={styles.wordmark} data-site-wordmark>
            raven
          </Link>
          <CommandPalette />
        </nav>
      </div>
    </header>
  );
}
