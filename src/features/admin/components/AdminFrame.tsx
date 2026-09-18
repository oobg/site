import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@constants/routes';
import styles from './AdminFrame.module.css';

export function AdminFrame({
  title,
  description,
  actions,
  backHref = ROUTES.ADMIN.HOME,
  backLabel = '개요',
  compact = false,
  contentAligned = false,
  children,
}: {
  title: string;
  description: string;
  userEmail?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
  contentAligned?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={styles.frame}
      data-compact={compact || undefined}
      data-content-aligned={contentAligned || undefined}
      aria-labelledby="admin-title"
    >
      <header className={styles.header}>
        <div>
          {title !== '개요' && title !== '글 관리' ? (
            <Link className={styles.kicker} href={backHref}>
              {backLabel}
            </Link>
          ) : null}
          <h1 id="admin-title" className={styles.title}>
            {title}
          </h1>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.headerActions}>{actions}</div>
      </header>
      {children}
    </section>
  );
}
