'use client';

import Link from 'next/link';
import { Dialog } from '@base-ui/react/dialog';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import type { BlogCategoryWithCount } from '@features/posts/types/posts.types';
import { homeSearchHref, ROUTES } from '@constants/routes';
import styles from './BlogShell.module.css';

function Navigation({
  categories,
  close = false,
  activeCategory: suppliedCategory,
  onNavigate,
}: {
  categories: BlogCategoryWithCount[];
  close?: boolean;
  activeCategory?: string;
  onNavigate?: (href: string) => void;
}) {
  const searchParams = useSearchParams();
  const activeCategory = suppliedCategory ?? searchParams.get('category');
  const homeActive = suppliedCategory
    ? false
    : !activeCategory &&
      !searchParams.get('q') &&
      !searchParams.get('tag') &&
      !searchParams.get('view') &&
      Number(searchParams.get('page') ?? 1) <= 1;
  const items = [
    { href: ROUTES.HOME, label: '홈' },
    ...categories
      .filter((category) => category.post_count > 0)
      .map((category) => ({
        href: homeSearchHref({ category: category.slug }),
        label: category.name,
      })),
  ];
  return (
    <nav className={styles.navigation} aria-label="블로그 주제">
      {items.map((item) => {
        const itemCategory = item.href.includes('?')
          ? new URLSearchParams(item.href.split('?')[1]).get('category')
          : null;
        const current = item.href === ROUTES.HOME ? homeActive : itemCategory === activeCategory;
        const onClick = onNavigate
          ? (event: React.MouseEvent) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              onNavigate(item.href);
            }
          : undefined;
        return close ? (
          <Dialog.Close
            key={item.href}
            nativeButton={false}
            render={
              <Link
                href={item.href}
                role="link"
                aria-current={current ? 'page' : undefined}
                onClick={onClick}
              />
            }
          >
            {item.label}
          </Dialog.Close>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            onClick={onClick}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BlogShell({
  categories,
  search,
  activeCategory,
  onNavigate,
  children,
}: {
  categories: BlogCategoryWithCount[];
  search?: React.ReactNode;
  activeCategory?: string;
  onNavigate?: (href: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <strong className={styles.title}>기술 블로그</strong>
        <Navigation
          categories={categories}
          activeCategory={activeCategory}
          onNavigate={onNavigate}
        />
        {search ?? (
          <Link className={styles.searchLink} href="/?view=all#archive-title">
            <MagnifyingGlass aria-hidden size={17} /> 검색
          </Link>
        )}
      </aside>
      <div className={styles.mobileBar}>
        <strong>기술 블로그</strong>
        <Dialog.Root>
          <Dialog.Trigger className={styles.menuButton}>주제 보기</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className={styles.backdrop} />
            <Dialog.Popup className={styles.menu}>
              <Dialog.Title>기술 블로그</Dialog.Title>
              <Navigation
                categories={categories}
                close
                activeCategory={activeCategory}
                onNavigate={onNavigate}
              />
              <Dialog.Close
                nativeButton={false}
                render={
                  <Link className={styles.searchLink} href="/?view=all#archive-title" role="link" />
                }
              >
                <MagnifyingGlass aria-hidden size={17} /> 검색
              </Dialog.Close>
              <Dialog.Close className={styles.close} aria-label="메뉴 닫기">
                <X aria-hidden size={22} />
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      {search ? <div className={styles.mobileSearch}>{search}</div> : null}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
