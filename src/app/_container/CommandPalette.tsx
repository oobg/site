'use client';

import { Dialog } from '@base-ui/react/dialog';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Folder, House, MagnifyingGlass, User } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ROUTES } from '@constants/routes';
import { blogPostsQueryOptions } from '@features/posts/services/posts.query';
import styles from './CommandPalette.module.css';

type PaletteItem = {
  id: string;
  label: string;
  meta: string;
  href: string;
  kind: 'page' | 'category' | 'post';
};

const pages: PaletteItem[] = [
  { id: 'home', label: '홈', meta: '페이지', href: ROUTES.HOME, kind: 'page' },
  { id: 'about', label: '소개', meta: '페이지', href: ROUTES.ABOUT, kind: 'page' },
];

export function CommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const navigatingRef = useRef(false);
  const composingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const { data, isLoading, isError } = useQuery({
    ...blogPostsQueryOptions({ q: debouncedQuery, page: 1, pageSize: 6 }),
    enabled: open,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (composingRef.current || event.isComposing || event.keyCode === 229) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase('en-US') === 'k') {
        event.preventDefault();
        if (!open) {
          openerRef.current = document.activeElement as HTMLElement | null;
          navigatingRef.current = false;
        }
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const normalized = query.trim().toLocaleLowerCase('ko-KR');
    const staticItems = pages.filter(
      (item) => !normalized || item.label.toLocaleLowerCase('ko-KR').includes(normalized),
    );
    const categories = (data?.categories ?? [])
      .filter(
        (category) => !normalized || category.name.toLocaleLowerCase('ko-KR').includes(normalized),
      )
      .map((category) => ({
        id: `category-${category.id}`,
        label: category.name,
        meta: '카테고리',
        href: `/?category=${encodeURIComponent(category.slug)}`,
        kind: 'category' as const,
      }));
    const posts = (query.trim() === debouncedQuery ? (data?.archive.items ?? []) : []).map(
      (post) => ({
        id: `post-${post.slug}`,
        label: post.title,
        meta: post.category.name,
        href: ROUTES.BLOG.DETAIL(post.category.slug, post.slug),
        kind: 'post' as const,
      }),
    );
    return [...staticItems, ...categories, ...posts];
  }, [data, debouncedQuery, query]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));

  useEffect(() => {
    const active = document.getElementById(
      items[safeActiveIndex] ? `${listboxId}-${items[safeActiveIndex].id}` : '',
    );
    if (active instanceof HTMLElement && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [items, listboxId, safeActiveIndex]);

  const navigate = (item: PaletteItem) => {
    navigatingRef.current = true;
    setOpen(false);
    router.push(item.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) {
      if (event.key === 'Escape') event.stopPropagation();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (items.length ? (current + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (items.length ? (current - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter' && items[safeActiveIndex]) {
      event.preventDefault();
      navigate(items[safeActiveIndex]);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) navigatingRef.current = false;
      }}
    >
      <Dialog.Trigger
        className={styles.trigger}
        aria-label="검색 열기"
        onClick={(event) => {
          openerRef.current = event.currentTarget;
          navigatingRef.current = false;
        }}
      >
        <MagnifyingGlass aria-hidden="true" />
        <span>검색</span>
        <kbd>⌘ K</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Viewport className={styles.viewport}>
          <Dialog.Popup
            className={styles.popup}
            initialFocus={inputRef}
            finalFocus={() => (navigatingRef.current ? false : openerRef.current)}
          >
            <Dialog.Title className={styles.srOnly}>검색 및 바로가기</Dialog.Title>
            <Dialog.Description className={styles.srOnly}>
              글, 카테고리, 페이지를 검색합니다.
            </Dialog.Description>
            <div className={styles.searchField}>
              <MagnifyingGlass aria-hidden="true" />
              <label className={styles.srOnly} htmlFor={`${listboxId}-input`}>
                검색어
              </label>
              <input
                ref={inputRef}
                id={`${listboxId}-input`}
                role="combobox"
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded="true"
                aria-activedescendant={
                  items[safeActiveIndex] ? `${listboxId}-${items[safeActiveIndex].id}` : undefined
                }
                value={query}
                placeholder="글, 카테고리, 페이지 검색"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                onCompositionStart={() => {
                  composingRef.current = true;
                }}
                onCompositionEnd={() => {
                  composingRef.current = false;
                }}
              />
              <Dialog.Close className={styles.close} aria-label="검색 닫기">
                Esc
              </Dialog.Close>
            </div>
            <div className={styles.results}>
              {isError ? (
                <p className={styles.state} role="alert">
                  검색 결과를 불러오지 못했습니다.
                </p>
              ) : null}
              {isLoading || query.trim() !== debouncedQuery ? (
                <p className={styles.state} role="status">
                  검색하는 중…
                </p>
              ) : null}
              {!isLoading && !isError && query.trim() === debouncedQuery && items.length === 0 ? (
                <p className={styles.state}>검색 결과가 없습니다.</p>
              ) : null}
              <div id={listboxId} role="listbox" aria-label="검색 결과">
                {items.map((item, index) => {
                  const Icon =
                    item.kind === 'post'
                      ? ArrowRight
                      : item.kind === 'category'
                        ? Folder
                        : item.id === 'home'
                          ? House
                          : User;
                  return (
                    <button
                      key={item.id}
                      id={`${listboxId}-${item.id}`}
                      className={styles.result}
                      role="option"
                      aria-selected={index === safeActiveIndex}
                      data-active={index === safeActiveIndex || undefined}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => navigate(item)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                      <small>{item.meta}</small>
                    </button>
                  );
                })}
              </div>
            </div>
            <footer className={styles.hint}>
              ↑↓ 이동 <span>Enter 열기</span> <span>Esc 닫기</span>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
