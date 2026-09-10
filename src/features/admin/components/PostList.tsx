'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FilePlus } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import styles from './PostList.module.css';

export type AdminPostListItem = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
}

export function PostList({
  posts,
  selectedId,
  compact = false,
}: {
  posts: AdminPostListItem[];
  selectedId?: string;
  compact?: boolean;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const visiblePosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          (status === 'all' || post.status === status) &&
          (!query.trim() ||
            post.title.toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko'))),
      ),
    [posts, query, status],
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('raven:admin-list-context') ?? '{}') as {
        query?: string;
        status?: 'all' | 'draft' | 'published';
        scrollTop?: number;
        windowScrollY?: number;
      };
      requestAnimationFrame(() => {
        setQuery(saved.query ?? '');
        setStatus(saved.status ?? 'all');
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: saved.scrollTop ?? 0 });
          if (!compact) {
            window.scrollTo({ top: saved.windowScrollY ?? 0 });
          }
        });
      });
    } catch {
      // Storage failure must not block the list.
    }
  }, [compact]);

  const rememberContext = () => {
    try {
      sessionStorage.setItem(
        'raven:admin-list-context',
        JSON.stringify({
          query,
          status,
          scrollTop: listRef.current?.scrollTop ?? 0,
          windowScrollY: window.scrollY,
        }),
      );
    } catch {
      // Storage failure must not block navigation.
    }
  };

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <FilePlus aria-hidden size={28} weight="regular" />
        <h2>아직 작성한 글이 없어요</h2>
        <p>첫 초안을 만들면 이곳에서 상태와 수정일을 확인할 수 있어요.</p>
        <Link className={styles.primary} href={ROUTES.ADMIN.NEW_POST}>
          새 글 작성
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.listArea}>
      <div className={styles.filters}>
        <label>
          <span className={styles.visuallyHidden}>상태</span>
          <select
            aria-label="글 상태"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="all">전체</option>
            <option value="draft">초안</option>
            <option value="published">공개</option>
          </select>
        </label>
        <label>
          <span className={styles.visuallyHidden}>제목 검색</span>
          <input
            aria-label="제목 검색"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 검색"
          />
        </label>
      </div>
      <ul
        ref={listRef}
        className={styles.list}
        aria-label="글 목록"
        data-compact={compact || undefined}
      >
        {visiblePosts.map((post) => (
          <li
            className={styles.row}
            data-current={post.id === selectedId || undefined}
            key={post.id}
          >
            <div className={styles.content}>
              <Link
                className={styles.title}
                href={ROUTES.ADMIN.POST(post.id)}
                aria-current={post.id === selectedId ? 'page' : undefined}
                onClick={rememberContext}
              >
                {post.title}
              </Link>
              <span className={styles.slug}>/{post.slug}</span>
            </div>
            <div className={styles.meta}>
              <span className={post.status === 'published' ? styles.published : styles.draft}>
                {post.status === 'published' ? '공개' : '초안'}
              </span>
              <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
              <ArrowRight aria-hidden size={18} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
