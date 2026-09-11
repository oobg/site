'use client';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { FilePlus } from '@phosphor-icons/react';
import { ROUTES } from '@constants/routes';
import { updatePostStatusAction } from '@features/admin/services/posts.actions';
import styles from './PostList.module.css';

export type AdminPostListItem = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  updatedAt: string;
  body?: string;
  coverImageUrl?: string | null;
};

const PAGE_SIZE = 10;
function firstImage(body = '') {
  return /!\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/.exec(body)?.[1] ?? null;
}
function withFreshOverride(post: AdminPostListItem, override?: Partial<AdminPostListItem>) {
  if (!override?.updatedAt || new Date(override.updatedAt) <= new Date(post.updatedAt)) return post;
  return { ...post, ...override };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
}

export function PostList({ posts }: { posts: AdminPostListItem[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | AdminPostListItem['status']>('all');
  const [sort, setSort] = useState<'updated-desc' | 'updated-asc' | 'title-asc'>('updated-desc');
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, Partial<AdminPostListItem>>>({});
  const [message, setMessage] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();
  const filtered = useMemo(
    () =>
      posts
        .map((post) => withFreshOverride(post, overrides[post.id]))
        .filter((post) => {
          const matchesQuery = `${post.title} ${post.slug}`
            .toLocaleLowerCase('ko')
            .includes(query.trim().toLocaleLowerCase('ko'));
          return matchesQuery && (status === 'all' || post.status === status);
        })
        .sort((a, b) =>
          sort === 'title-asc'
            ? a.title.localeCompare(b.title, 'ko')
            : (sort === 'updated-asc' ? -1 : 1) *
              (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        ),
    [overrides, posts, query, status, sort],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const changeStatus = (post: AdminPostListItem, next: AdminPostListItem['status']) => {
    setPendingIds((current) => new Set(current).add(post.id));
    setMessage('');
    startTransition(async () => {
      try {
        const result = await updatePostStatusAction(post.id, next);
        if (result.status === 'success')
          setOverrides((current) => ({
            ...current,
            [post.id]: { status: next, updatedAt: result.updatedAt ?? post.updatedAt },
          }));
        setMessage(result.message);
      } catch {
        setMessage('글 상태를 바꾸지 못했어요.');
      } finally {
        setPendingIds((current) => {
          const nextIds = new Set(current);
          nextIds.delete(post.id);
          return nextIds;
        });
      }
    });
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
    <section className={styles.list} aria-label="글 목록">
      <div className={styles.controls}>
        <label>
          글 검색
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="제목 또는 슬러그"
          />
        </label>
        <label>
          상태
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">전체</option>
            <option value="draft">초안</option>
            <option value="published">공개</option>
          </select>
        </label>
        <label>
          정렬
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as typeof sort);
              setPage(1);
            }}
          >
            <option value="updated-desc">최근 수정 순</option>
            <option value="updated-asc">오래된 수정 순</option>
            <option value="title-asc">제목 순</option>
          </select>
        </label>
      </div>
      <p className={styles.feedback} aria-live="polite">
        {message}
      </p>
      {visible.length ? (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>대표 이미지</th>
                <th aria-sort={sort === 'title-asc' ? 'ascending' : 'none'}>글</th>
                <th>상태</th>
                <th
                  aria-sort={
                    sort === 'updated-desc'
                      ? 'descending'
                      : sort === 'updated-asc'
                        ? 'ascending'
                        : 'none'
                  }
                >
                  수정일
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className={styles.thumbnail}>
                      {(post.coverImageUrl ?? firstImage(post.body)) ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary CDN URLs need an error fallback.
                        <img
                          src={(post.coverImageUrl ?? firstImage(post.body))!}
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
                  <td>
                    <Link className={styles.title} href={ROUTES.ADMIN.POST(post.id)}>
                      {post.title}
                    </Link>
                    <span className={styles.slug}>/{post.slug}</span>
                  </td>
                  <td>
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
                  <td>
                    <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.noResults}>
          <p>조건에 맞는 글이 없어요.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStatus('all');
              setPage(1);
            }}
          >
            필터 초기화
          </button>
        </div>
      )}
      {pages > 1 ? (
        <nav className={styles.pagination} aria-label="글 목록 페이지">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(Math.max(1, currentPage - 1))}
          >
            이전
          </button>
          <span>
            {currentPage} / {pages}
          </span>
          <button
            disabled={currentPage === pages}
            onClick={() => setPage(Math.min(pages, currentPage + 1))}
          >
            다음
          </button>
        </nav>
      ) : null}
    </section>
  );
}
