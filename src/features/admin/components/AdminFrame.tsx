import Link from 'next/link';
import type { ReactNode } from 'react';
import { SignOut } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import { signOutAction } from '@features/admin/services/auth.actions';
import styles from './AdminFrame.module.css';

export function AdminFrame({
  title,
  description,
  userEmail,
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
          <Link className={styles.kicker} href={ROUTES.ADMIN.HOME}>
            글 관리
          </Link>
          <h1 id="admin-title" className={styles.title}>
            {title}
          </h1>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.headerActions}>{actions}</div>
      </header>
      {userEmail ? (
        <div className={styles.session}>
          <span>{userEmail}</span>
          <form action={signOutAction}>
            <button className={styles.signOut} type="submit">
              <SignOut aria-hidden size={16} weight="bold" />
              로그아웃
            </button>
          </form>
        </div>
      ) : null}
      {children}
    </section>
  );
}
