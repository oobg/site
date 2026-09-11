import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@constants/routes';
import styles from './AdminFrame.module.css';

export function AdminFrame({
  title,
  description,
  actions,
  compact = false,
  children,
}: {
  title: string;
  description: string;
  userEmail?: string;
  actions?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={styles.frame}
      data-compact={compact || undefined}
      aria-labelledby="admin-title"
    >
      <header className={styles.header}>
        <div>
          {title !== '글 관리' ? (
            <Link className={styles.kicker} href={ROUTES.ADMIN.HOME}>
              글 관리
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
