'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@constants/routes';
import type { BlogCategory } from '@features/posts/types/posts.types';
import styles from './PostList.module.css';

export type AdminPostListItem = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  categoryId?: string | null;
  categoryName?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
}

export function PostList({
  posts,
  selectedId,
  compact = false,
  categories = [],
}: {
  posts: AdminPostListItem[];
  selectedId?: string;
  compact?: boolean;
  categories?: BlogCategory[];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [category, setCategory] = useState('');
  const visiblePosts = useMemo(
    () =>
      [...posts]
        .filter(
          (post) =>
            (status === 'all' || post.status === status) &&
            (!category || post.categoryId === category) &&
            (!query.trim() ||
              post.title.toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko'))),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [category, posts, query, status],
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('raven:admin-list-context') ?? '{}') as {
        query?: string;
        status?: 'all' | 'draft' | 'published';
        category?: string;
        scrollTop?: number;
        windowScrollY?: number;
      };
      requestAnimationFrame(() => {
        setQuery(saved.query ?? '');
        setStatus(saved.status ?? 'all');
        setCategory(saved.category ?? '');
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
          category,
          scrollTop: listRef.current?.scrollTop ?? 0,
          windowScrollY: window.scrollY,
        }),
      );
    } catch {
      // Storage failure must not block navigation.
    }
  };

  return (
    <div className={styles.listArea} data-compact={compact || undefined}>
      <div className={styles.filters}>
        <div className={styles.segmented} aria-label="글 상태">
          {(
            [
              ['all', '전체'],
              ['draft', '초안'],
              ['published', '공개'],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              data-active={status === value || undefined}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          <span className={styles.visuallyHidden}>카테고리 필터</span>
          <select
            aria-label="카테고리 필터"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">모든 카테고리</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
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
      {!compact ? (
        <div className={styles.tableHeader} aria-hidden>
          <span>제목</span>
          <span>상태</span>
          <span>카테고리</span>
          <span>생성일 ↓</span>
          <span>최종 수정일</span>
          <span />
        </div>
      ) : null}
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
              <span className={styles.category}>{post.categoryName ?? '미분류'}</span>
              <time data-label="생성일" dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
              <time data-label="수정일" dateTime={post.updatedAt}>
                {formatDate(post.updatedAt)}
              </time>
              <Link
                className={styles.more}
                href={ROUTES.ADMIN.POST(post.id)}
                aria-label={`${post.title} 편집`}
              >
                •••
              </Link>
            </div>
          </li>
        ))}
        {visiblePosts.length === 0 ? (
          <li className={styles.empty}>
            <h2>{posts.length ? '조건에 맞는 글이 없어요' : '아직 작성한 글이 없어요'}</h2>
            <p>
              {posts.length
                ? '검색어나 필터를 바꿔 보세요.'
                : '상단의 새 글 버튼으로 첫 초안을 작성해 보세요.'}
            </p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
