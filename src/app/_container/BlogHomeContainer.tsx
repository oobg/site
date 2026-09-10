'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Container } from '@components/layout/Container';
import { Button } from '@components/ui/Button';
import { CategoryTabs } from '@components/ui/CategoryTabs';
import { FeaturedCarousel } from '@/app/_components/FeaturedCarousel';
import { PostCard } from '@features/posts/components/PostCard';
import { useBlogPosts } from '@features/posts/services/use-blog-posts';
import type { BlogHomeData, BlogPostFilters } from '@features/posts/types/posts.types';
import styles from './BlogHomeContainer.module.css';

const ALL = 'all';
type Filters = Required<Pick<BlogPostFilters, 'q' | 'category' | 'tag' | 'page' | 'pageSize'>>;

function SearchInput({
  initialQuery,
  onQueryChange,
}: {
  initialQuery: string;
  onQueryChange: (query: string) => void;
}) {
  const [input, setInput] = useState({ urlQuery: initialQuery, value: initialQuery });
  if (input.urlQuery !== initialQuery) {
    setInput({ urlQuery: initialQuery, value: initialQuery });
  }

  useEffect(() => {
    const normalized = input.value.trim();
    if (normalized === initialQuery) return;
    const timer = window.setTimeout(() => onQueryChange(normalized), 300);
    return () => window.clearTimeout(timer);
  }, [initialQuery, input.value, onQueryChange]);

  return (
    <label className={styles.search}>
      <span className={styles.srOnly}>글 검색</span>
      <input
        type="search"
        value={input.value}
        onChange={(event) => setInput({ urlQuery: initialQuery, value: event.target.value })}
        placeholder="제목이나 요약 검색"
      />
      {input.value && (
        <button
          type="button"
          onClick={() => setInput({ urlQuery: initialQuery, value: '' })}
          aria-label="검색어 지우기"
        >
          ×
        </button>
      )}
    </label>
  );
}

export function BlogHomeContainer({
  initialData,
  initialFilters,
}: {
  initialData: BlogHomeData;
  initialFilters: BlogPostFilters;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const filters = useMemo<Filters>(
    () => ({ q, category, tag, page, pageSize: 12 }),
    [category, page, q, tag],
  );
  const result = useBlogPosts(filters);
  const initialMatches =
    filters.q === (initialFilters.q ?? '') &&
    filters.category === (initialFilters.category ?? '') &&
    filters.tag === (initialFilters.tag ?? '') &&
    filters.page === (initialFilters.page ?? 1);
  const data = result.data ?? (initialMatches ? initialData : undefined);

  const navigate = useCallback(
    (next: Filters, replace = false) => {
      const params = new URLSearchParams();
      if (next.q) params.set('q', next.q);
      if (next.category) params.set('category', next.category);
      if (next.tag) params.set('tag', next.tag);
      if (next.page > 1) params.set('page', String(next.page));
      const href = `${pathname}${params.size ? `?${params}` : ''}`;
      window.history[replace ? 'replaceState' : 'pushState'](null, '', href);
    },
    [pathname],
  );

  const changeQuery = useCallback(
    (nextQuery: string) => navigate({ ...filters, q: nextQuery, page: 1 }, true),
    [filters, navigate],
  );

  const categories = useMemo(
    () => [
      { id: ALL, name: '전체' },
      ...(data?.categories ?? initialData.categories)
        .filter((category) => category.post_count > 0)
        .map((category) => ({ id: category.slug, name: category.name })),
    ],
    [data?.categories, initialData.categories],
  );

  return (
    <Container>
      <FeaturedCarousel posts={data?.featured ?? initialData.featured} />
      <section className={styles.archive} aria-labelledby="archive-title">
        <div className={styles.heading}>
          <div>
            <h2 id="archive-title">최근 글</h2>
            <p>새로 쓴 글부터 차례로 모았어요.</p>
          </div>
          <SearchInput initialQuery={filters.q} onQueryChange={changeQuery} />
        </div>
        {filters.tag && (
          <div className={styles.tagNotice}>
            <span>태그: {filters.tag}</span>
            <button type="button" onClick={() => navigate({ ...filters, tag: '', page: 1 })}>
              태그 필터 지우기
            </button>
          </div>
        )}
        <CategoryTabs
          categories={categories}
          value={filters.category || ALL}
          onValueChange={(category) =>
            navigate({ ...filters, category: category === ALL ? '' : category, page: 1 })
          }
        >
          {result.isError ? (
            <div className={styles.state} role="alert">
              <p>글을 불러오지 못했어요.</p>
              <Button onClick={() => result.refetch()}>다시 시도</Button>
            </div>
          ) : !data ? (
            <div className={styles.state} aria-live="polite">
              <p>글을 불러오고 있어요.</p>
            </div>
          ) : data.archive.items.length === 0 ? (
            <div className={styles.state}>
              <p>
                {filters.q || filters.category || filters.tag
                  ? '조건에 맞는 글이 없어요.'
                  : '아직 공개한 글이 없어요.'}
              </p>
            </div>
          ) : (
            <>
              <div
                className={styles.grid}
                data-loading={result.isFetching || undefined}
                aria-busy={result.isFetching}
              >
                {data.archive.items.map((post) => (
                  <PostCard
                    key={post.slug}
                    post={post}
                    reserveCoverSpace={data.archive.items.some((item) =>
                      Boolean(item.cover_image_url),
                    )}
                  />
                ))}
              </div>
              {data.archive.totalPages > 1 && (
                <nav className={styles.pagination} aria-label="글 페이지">
                  <Button
                    size="sm"
                    disabled={result.isFetching || filters.page <= 1}
                    onClick={() => navigate({ ...filters, page: filters.page - 1 })}
                  >
                    이전
                  </Button>
                  <span>
                    <strong>{data.archive.page}</strong> / {data.archive.totalPages}
                  </span>
                  <Button
                    size="sm"
                    disabled={result.isFetching || filters.page >= data.archive.totalPages}
                    onClick={() => navigate({ ...filters, page: filters.page + 1 })}
                  >
                    다음
                  </Button>
                </nav>
              )}
            </>
          )}
        </CategoryTabs>
      </section>
    </Container>
  );
}
