'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileText, Gear, ArrowSquareOut, ChatCircle } from '@phosphor-icons/react';
import { ROUTES } from '@constants/routes';
import styles from './AdminShell.module.css';

export function AdminShell({
  children,
  userEmail,
  banner,
  authorized,
  search,
}: {
  children: ReactNode;
  userEmail?: string;
  banner: ReactNode;
  authorized: boolean;
  search?: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const settings = pathname === ROUTES.ADMIN.HOME && searchParams.get('view') === 'settings';
  const comments = pathname === ROUTES.ADMIN.HOME && searchParams.get('view') === 'comments';
  const initial = userEmail?.trim().charAt(0).toUpperCase() || 'R';
  return (
    <div className={styles.shell}>
      {authorized ? (
        <a className={styles.skip} href="#main">
          본문으로 건너뛰기
        </a>
      ) : null}
      <header className={styles.topbar}>
        <Link href={ROUTES.ADMIN.HOME} className={styles.wordmark} data-site-wordmark>
          raven
        </Link>
        <div className={styles.search}>{search}</div>
        {authorized ? (
          <div className={styles.account}>
            <span className={styles.avatar} title={userEmail}>
              {initial}
            </span>
          </div>
        ) : null}
      </header>
      {banner}
      {authorized ? (
        <div className={styles.layout}>
          <nav className={styles.nav} aria-label="관리자 메뉴">
            <Link
              href={ROUTES.ADMIN.HOME}
              aria-current={
                !settings && !comments && pathname.startsWith('/admin') ? 'page' : undefined
              }
              data-active={(!settings && !comments && pathname.startsWith('/admin')) || undefined}
            >
              <FileText aria-hidden size={19} />글
            </Link>
            <Link
              href={`${ROUTES.ADMIN.HOME}?view=comments`}
              aria-current={comments ? 'page' : undefined}
              data-active={comments || undefined}
            >
              <ChatCircle aria-hidden size={19} />
              댓글
            </Link>
            <Link
              href={`${ROUTES.ADMIN.HOME}?view=settings`}
              aria-current={settings ? 'page' : undefined}
              data-active={settings || undefined}
            >
              <Gear aria-hidden size={19} />
              블로그 설정
            </Link>
            <Link href={ROUTES.HOME}>
              <ArrowSquareOut aria-hidden size={19} />
              사이트 보기
            </Link>
          </nav>
          <main className={styles.main} id="main" tabIndex={-1}>
            {children}
          </main>
        </div>
      ) : null}
    </div>
  );
}
