'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/app/_container/CommandPalette';
import { ROUTES } from '@constants/routes';
import styles from './SiteHeader.module.css';

// 프로젝트는 의도적으로 숨긴다. 링크를 되살리기 전에 소유자 결정을 먼저 확인한다.
const NAV_ITEMS = [
  { label: '글', href: ROUTES.HOME, section: 'posts' },
  { label: '소개', href: ROUTES.ABOUT, section: 'about' },
] as const;

type Section = (typeof NAV_ITEMS)[number]['section'];

/** 홈·`/blog/**`(주제 목록 포함)는 글, `/about`은 소개다. 그 밖의 경로는 어느 쪽도 아니다. */
function currentSection(pathname: string | null): Section | null {
  if (!pathname) return null;
  if (pathname === ROUTES.HOME) return 'posts';
  if (pathname === ROUTES.BLOG.LIST || pathname.startsWith(`${ROUTES.BLOG.LIST}/`)) return 'posts';
  if (pathname === ROUTES.ABOUT || pathname.startsWith(`${ROUTES.ABOUT}/`)) return 'about';
  return null;
}

export function SiteHeader() {
  const current = currentSection(usePathname());

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.pill}>
          <Link href={ROUTES.HOME} className={styles.wordmark} data-site-wordmark>
            raven
          </Link>
          <div className={styles.actions}>
            <nav aria-label="주요 내비게이션">
              <ul className={styles.navList}>
                {NAV_ITEMS.map((item) => (
                  <li key={item.section}>
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      aria-current={current === item.section ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <CommandPalette />
          </div>
        </div>
      </div>
    </header>
  );
}
