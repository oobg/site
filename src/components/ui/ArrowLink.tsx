import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './ArrowLink.module.css';

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.link}>
      {children}
      <span className={styles.arrow} aria-hidden>
        →
      </span>
    </Link>
  );
}
