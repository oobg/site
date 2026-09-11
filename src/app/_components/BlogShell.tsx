'use client';

import Link from 'next/link';
import { Dialog } from '@base-ui/react/dialog';
import { CaretDown, X } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import type { BlogCategoryWithCount } from '@features/posts/types/posts.types';
import { homeSearchHref, ROUTES } from '@constants/routes';
import styles from './BlogShell.module.css';

function Navigation({
  categories,
  close = false,
  activeCategory: suppliedCategory,
  onNavigate,
  compact = false,
}: {
  categories: BlogCategoryWithCount[];
  close?: boolean;
  activeCategory?: string;
  onNavigate?: (href: string) => void;
  compact?: boolean;
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
  const categoryItems = categories
    .filter((category) => category.post_count > 0)
    .map((category) => ({
      href: homeSearchHref({ category: category.slug }),
      label: category.name,
      slug: category.slug,
    }));
  const currentItem = categoryItems.find((item) => item.slug === activeCategory);
  const otherItems = categoryItems.filter((item) => item.slug !== activeCategory);
  const items = compact
    ? [{ href: ROUTES.HOME, label: '홈', slug: '' }, ...(currentItem ? [currentItem] : [])]
    : [{ href: ROUTES.HOME, label: '홈', slug: '' }, ...categoryItems];
  const renderItem = (item: (typeof items)[number]) => {
    const current = item.href === ROUTES.HOME ? homeActive : item.slug === activeCategory;
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
  };
  return (
    <nav className={styles.navigation} aria-label="블로그 주제">
      {items.map(renderItem)}
      {compact && otherItems.length > 0 ? (
        <details className={styles.otherCategories}>
          <summary>
            다른 카테고리 <CaretDown aria-hidden size={14} />
          </summary>
          <div>{otherItems.map(renderItem)}</div>
        </details>
      ) : null}
    </nav>
  );
}

export function BlogShell({
  categories,
  activeCategory,
  onNavigate,
  detailNavigation,
  mobileDetailNavigation,
  children,
}: {
  categories: BlogCategoryWithCount[];
  activeCategory?: string;
  onNavigate?: (href: string) => void;
  detailNavigation?: React.ReactNode;
  mobileDetailNavigation?: React.ReactNode;
  children: React.ReactNode;
}) {
  const mobileCategory = activeCategory
    ? categories.find((category) => category.slug === activeCategory)?.name
    : undefined;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <strong className={styles.title}>기술 블로그</strong>
        <Navigation
          categories={categories}
          activeCategory={activeCategory}
          onNavigate={onNavigate}
          compact={Boolean(detailNavigation)}
        />
        {detailNavigation ? (
          <div className={styles.detailNavigation}>{detailNavigation}</div>
        ) : null}
      </aside>
      <div className={styles.mobileBar}>
        <Dialog.Root>
          <Dialog.Trigger className={styles.menuButton} aria-label="블로그 카테고리 선택">
            <strong>{mobileCategory ?? '기술 블로그'}</strong>
            <CaretDown aria-hidden size={16} />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className={styles.backdrop} />
            <Dialog.Popup className={styles.menu}>
              <Dialog.Title>기술 블로그</Dialog.Title>
              <Navigation
                categories={categories}
                close
                activeCategory={activeCategory}
                onNavigate={onNavigate}
                compact={Boolean(detailNavigation)}
              />
              <Dialog.Close className={styles.close} aria-label="메뉴 닫기">
                <X aria-hidden size={22} />
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      {mobileDetailNavigation ? (
        <div className={styles.mobileDetailNavigation}>{mobileDetailNavigation}</div>
      ) : null}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
