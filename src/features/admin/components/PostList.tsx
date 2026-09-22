'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr';
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
const postListFilterParsers = {
  status: parseAsStringLiteral(['all', 'draft', 'published'] as const).withDefault('all'),
  category: parseAsString.withDefault(''),
  query: parseAsString.withDefault(''),
};
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
  const [{ status, category, query }, setFilters] = useQueryStates(postListFilterParsers, {
    history: 'push',
  });
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState('');
  const [, startTransition] = useTransition();
  const postsWithOverrides = useMemo(
    () => posts.map((post) => withFreshOverride(post, overrides[post.id])),
    [overrides, posts],
  );
  const statusCounts = useMemo(
    () => ({
      all: postsWithOverrides.length,
      draft: postsWithOverrides.filter((post) => post.status === 'draft').length,
      published: postsWithOverrides.filter((post) => post.status === 'published').length,
    }),
    [postsWithOverrides],
  );
  const visiblePosts = useMemo(
    () =>
      postsWithOverrides
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
    [category, postsWithOverrides, query, sortDirection, sortKey, status],
  );
  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePosts = visiblePosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const postHref = (id: string) => {
    const search = new URLSearchParams();
    if (status !== 'all') search.set('status', status);
    if (category) search.set('category', category);
    if (query) search.set('query', query);
    const queryString = search.toString();
    return `${ROUTES.ADMIN.POST(id)}${queryString ? `?${queryString}` : ''}`;
  };

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
        scrollTop?: number;
        windowScrollY?: number;
      };
      requestAnimationFrame(() => {
        if (saved.query !== undefined && saved.query !== query) {
          void setFilters({ query: saved.query });
        }
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
  }, [compact, query, setFilters]);

  const rememberContext = () => {
    try {
      sessionStorage.setItem(
        'raven:admin-list-context',
        JSON.stringify({
          query,
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
                void setFilters({ status: value });
                setPage(1);
              }}
            >
              <span>{label}</span>
              <span className={styles.filterCount} aria-hidden="true">
                {statusCounts[value]}
              </span>
            </button>
          ))}
        </div>
        <label>
          <span className={styles.visuallyHidden}>카테고리 필터</span>
          <select
            aria-label="카테고리 필터"
            value={category}
            onChange={(event) => {
              void setFilters({ category: event.target.value });
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
              void setFilters({ query: event.target.value });
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
                        href={postHref(post.id)}
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
                      href={postHref(post.id)}
                      aria-label={`${post.title} 편집`}
                    >
                      <DotsThreeVertical aria-hidden size={18} weight="bold" />
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
                  href={postHref(post.id)}
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
                  href={postHref(post.id)}
                  aria-label={`${post.title} 편집`}
                >
                  <DotsThreeVertical aria-hidden size={18} weight="bold" />
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
