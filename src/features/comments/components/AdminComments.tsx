'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowClockwise,
  Check,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  Trash,
} from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import type { AdminComment } from '@features/comments/types/comments.types';
import styles from './AdminComments.module.css';

type Filter = 'all' | 'visible' | 'hidden';
type Sort = 'newest' | 'oldest';

const filterLabels: Record<Filter, string> = {
  all: '전체',
  visible: '공개',
  hidden: '숨김',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export function AdminComments() {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/comments');
      const payload = (await response.json()) as { items?: AdminComment[] };
      if (!response.ok || !payload.items) throw new Error();
      setItems(payload.items);
    } catch {
      setError('댓글을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/admin/comments', { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { items?: AdminComment[] };
        if (!response.ok || !payload.items) throw new Error();
        setItems(payload.items);
      })
      .catch((reason) => {
        if ((reason as Error).name !== 'AbortError') setError('댓글을 불러오지 못했어요.');
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, []);

  const remove = async (id: string) => {
    if (pendingId) return;
    setPendingId(id);
    setError('');
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error();
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError('댓글을 삭제하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setPendingId(null);
    }
  };

  const toggleVisibility = async (item: AdminComment) => {
    if (pendingId) return;
    setPendingId(item.id);
    setError('');
    const status = item.moderation_status === 'visible' ? 'hidden' : 'visible';
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: item.id, status }),
      });
      if (!response.ok) throw new Error();
      setItems((current) =>
        current.map((comment) =>
          comment.id === item.id ? { ...comment, moderation_status: status } : comment,
        ),
      );
    } catch {
      setError('댓글 상태를 바꾸지 못했어요. 다시 시도해 주세요.');
    } finally {
      setPendingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: items.length,
      visible: items.filter((item) => item.moderation_status === 'visible').length,
      hidden: items.filter((item) => item.moderation_status === 'hidden').length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    return items
      .filter((item) => {
        const matchesFilter = filter === 'all' || item.moderation_status === filter;
        const matchesQuery =
          !normalizedQuery ||
          [item.nickname, item.body, item.post_slug].some((value) =>
            value.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
          );
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => {
        const difference = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sort === 'newest' ? -difference : difference;
      });
  }, [filter, items, query, sort]);

  if (loading)
    return (
      <div className={styles.loading} aria-label="댓글을 불러오는 중" aria-busy="true">
        <span />
        <span />
        <span />
      </div>
    );
  return (
    <div className={styles.wrap}>
      {error ? (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={load}>
            <ArrowClockwise aria-hidden size={16} />
            다시 시도
          </button>
        </div>
      ) : null}
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="댓글 상태">
          {(Object.keys(filterLabels) as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? styles.activeTab : undefined}
              onClick={() => setFilter(value)}
            >
              {filterLabels[value]}
              <span>{counts[value]}</span>
            </button>
          ))}
        </div>
        <label className={styles.search}>
          <MagnifyingGlass aria-hidden size={17} />
          <span className={styles.visuallyHidden}>댓글 검색</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="닉네임, 내용, 게시글 slug 검색"
          />
        </label>
        <label className={styles.sort}>
          <span>정렬</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </label>
      </div>
      {filteredItems.length ? (
        <ul className={styles.list}>
          {filteredItems.map((item) => (
            <li key={item.id} className={styles.item}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/comment-avatars/${item.avatar_id}.webp`} alt="" />
              <div className={styles.content}>
                <div className={styles.meta}>
                  <strong>{item.nickname}</strong>
                  <a href={ROUTES.BLOG.DETAIL(item.post_slug)} target="_blank" rel="noreferrer">
                    /{item.post_slug}
                  </a>
                  <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                  <span className={styles.status} data-status={item.moderation_status}>
                    {filterLabels[item.moderation_status]}
                  </span>
                </div>
                <p>{item.body}</p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => toggleVisibility(item)}
                  aria-label={`${item.nickname} 댓글 ${item.moderation_status === 'visible' ? '숨기기' : '공개'}`}
                >
                  {item.moderation_status === 'visible' ? (
                    <EyeSlash aria-hidden size={17} />
                  ) : (
                    <Eye aria-hidden size={17} />
                  )}
                  <span>{item.moderation_status === 'visible' ? '숨기기' : '공개'}</span>
                </button>
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => remove(item.id)}
                  aria-label={`${item.nickname} 댓글 삭제`}
                >
                  <Trash aria-hidden size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty} role="status">
          <Check aria-hidden size={24} />
          <strong>{items.length ? '조건에 맞는 댓글이 없어요.' : '아직 댓글이 없어요.'}</strong>
          <span>
            {items.length
              ? '다른 상태 탭을 선택하거나 검색어를 바꿔 보세요.'
              : '새 댓글이 등록되면 이곳에서 바로 관리할 수 있어요.'}
          </span>
        </div>
      )}
    </div>
  );
}
