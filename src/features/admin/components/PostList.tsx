'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { ROUTES } from '@constants/routes';
import type { BlogCategory } from '@features/posts/types/posts.types';
import { updatePostStatusAction } from '@features/admin/services/posts.actions';
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
  coverImageUrl?: string | null;
  coverPositionX?: number;
  coverPositionY?: number;
};

const PAGE_SIZE = 10;
type SortKey = 'title' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const DEFAULT_SORT_DIRECTION: Record<SortKey, SortDirection> = {
  title: 'asc',
  createdAt: 'desc',
  updatedAt: 'desc',
};

function withFreshOverride(post: AdminPostListItem, override?: Partial<AdminPostListItem>) {
  if (!override?.updatedAt || new Date(override.updatedAt) <= new Date(post.updatedAt)) return post;
  return { ...post, ...override };
}

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
  const tableRef = useRef<HTMLDivElement>(null);
  const compactListRef = useRef<HTMLUListElement>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<AdminPostListItem>>>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [category, setCategory] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState('');
  const [, startTransition] = useTransition();
  const visiblePosts = useMemo(
    () =>
      posts
        .map((post) => withFreshOverride(post, overrides[post.id]))
        .filter(
          (post) =>
            (status === 'all' || post.status === status) &&
            (!category || post.categoryId === category) &&
            (!query.trim() ||
              post.title.toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko'))),
        )
        .sort((a, b) => {
          const comparison =
            sortKey === 'title'
              ? a.title.localeCompare(b.title, 'ko')
              : new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime();
          return sortDirection === 'asc' ? comparison : -comparison;
        }),
    [category, overrides, posts, query, sortDirection, sortKey, status],
  );
  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePosts = visiblePosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeSort = (nextSortKey: SortKey) => {
    setSortDirection((currentDirection) =>
      sortKey === nextSortKey
        ? currentDirection === 'asc'
          ? 'desc'
          : 'asc'
        : DEFAULT_SORT_DIRECTION[nextSortKey],
    );
    setSortKey(nextSortKey);
    setPage(1);
  };

  const ariaSort = (key: SortKey) =>
    sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none';

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
        setStatus(['draft', 'published'].includes(saved.status ?? '') ? saved.status! : 'all');
        setCategory(saved.category ?? '');
        requestAnimationFrame(() => {
          (compact ? compactListRef.current : tableRef.current)?.scrollTo({
            top: saved.scrollTop ?? 0,
          });
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
          scrollTop: (compact ? compactListRef.current : tableRef.current)?.scrollTop ?? 0,
          windowScrollY: window.scrollY,
        }),
      );
    } catch {
      // Storage failure must not block navigation.
    }
  };

  const changeStatus = (post: AdminPostListItem, nextStatus: AdminPostListItem['status']) => {
    setPendingIds((current) => new Set(current).add(post.id));
    setMessage('');
    startTransition(async () => {
      try {
        const result = await updatePostStatusAction(post.id, nextStatus);
        if (result.status === 'success')
          setOverrides((current) => ({
            ...current,
            [post.id]: {
              status: nextStatus,
              updatedAt: result.updatedAt ?? post.updatedAt,
            },
          }));
        setMessage(result.message);
      } catch {
        setMessage('글 상태를 바꾸지 못했어요.');
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(post.id);
          return next;
        });
      }
    });
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
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
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
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="제목 검색"
          />
        </label>
      </div>
      <p className={styles.feedback} aria-live="polite">
        {message}
      </p>
      {!compact ? (
        <div className={styles.tableWrap} ref={tableRef}>
          <table className={styles.table} aria-label="글 목록">
            <thead>
              <tr>
                <th>대표 이미지</th>
                <th aria-sort={ariaSort('title')}>
                  <button
                    className={styles.sortButton}
                    type="button"
                    onClick={() => changeSort('title')}
                  >
                    제목
                    <span aria-hidden>
                      {sortKey === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                </th>
                <th>상태</th>
                <th aria-sort={ariaSort('createdAt')}>
                  <button
                    className={styles.sortButton}
                    type="button"
                    onClick={() => changeSort('createdAt')}
                  >
                    생성일
                    <span aria-hidden>
                      {sortKey === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                </th>
                <th aria-sort={ariaSort('updatedAt')}>
                  <button
                    className={styles.sortButton}
                    type="button"
                    onClick={() => changeSort('updatedAt')}
                  >
                    수정일
                    <span aria-hidden>
                      {sortKey === 'updatedAt' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                </th>
                <th>
                  <span className={styles.visuallyHidden}>작업</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagePosts.map((post) => (
                <tr key={post.id}>
                  <td data-label="대표 이미지">
                    <div className={styles.thumbnail}>
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                            event.currentTarget.parentElement?.setAttribute('data-error', '');
                          }}
                        />
                      ) : null}
                      <span aria-hidden>이미지 없음</span>
                    </div>
                  </td>
                  <td data-label="제목">
                    <div className={styles.content}>
                      <span className={styles.category}>{post.categoryName ?? '미분류'}</span>
                      <Link
                        className={styles.title}
                        href={ROUTES.ADMIN.POST(post.id)}
                        onClick={rememberContext}
                      >
                        {post.title}
                      </Link>
                      <span className={styles.slug}>/{post.slug}</span>
                    </div>
                  </td>
                  <td data-label="상태">
                    <select
                      className={styles.statusSelect}
                      aria-label={`${post.title} 상태`}
                      value={post.status}
                      disabled={pendingIds.has(post.id)}
                      onChange={(event) =>
                        changeStatus(post, event.target.value as AdminPostListItem['status'])
                      }
                    >
                      <option value="draft">초안</option>
                      <option value="published">공개</option>
                    </select>
                  </td>
                  <td data-label="생성일">
                    <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                  </td>
                  <td data-label="수정일">
                    <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                  </td>
                  <td data-label="작업">
                    <Link
                      className={styles.more}
                      href={ROUTES.ADMIN.POST(post.id)}
                      aria-label={`${post.title} 편집`}
                    >
                      •••
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!compact && visiblePosts.length === 0 ? (
        <div className={styles.empty}>
          <h2>{posts.length ? '조건에 맞는 글이 없어요' : '아직 작성한 글이 없어요'}</h2>
          <p>
            {posts.length
              ? '검색어나 필터를 바꿔 보세요.'
              : '상단의 새 글 버튼으로 첫 초안을 작성해 보세요.'}
          </p>
        </div>
      ) : null}
      {!compact && totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="글 목록 페이지">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(Math.max(1, currentPage - 1))}
          >
            이전
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          >
            다음
          </button>
        </nav>
      ) : null}
      {compact ? (
        <ul
          ref={compactListRef}
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
                <span className={styles.category}>{post.categoryName ?? '미분류'}</span>
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
      ) : null}
    </div>
  );
}
