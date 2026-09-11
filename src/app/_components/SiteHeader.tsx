'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CommandPalette } from '@/app/_container/CommandPalette';
import { ROUTES } from '@constants/routes';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={styles.header} data-stuck={stuck || undefined}>
        <div className={styles.inner}>
          <nav className={styles.pill} aria-label="주요 내비게이션">
            <Link href={ROUTES.HOME} className={styles.wordmark} data-site-wordmark>
              raven
            </Link>
            <CommandPalette />
          </nav>
        </div>
      </header>
    </>
  );
}
