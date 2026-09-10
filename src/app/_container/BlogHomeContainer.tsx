'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@components/ui/Button';
import { FeaturedCarousel } from '@/app/_components/FeaturedCarousel';
import { BlogShell } from '@/app/_components/BlogShell';
import { BlogArchiveContentSkeleton } from '@/app/_components/BlogLoadingSkeleton';
import { PostCard } from '@features/posts/components/PostCard';
import { useBlogPosts } from '@features/posts/services/use-blog-posts';
import type { BlogHomeData, BlogPostFilters } from '@features/posts/types/posts.types';
import { homeSearchHref } from '@constants/routes';
import styles from './BlogHomeContainer.module.css';

type Filters = Required<Pick<BlogPostFilters, 'q' | 'category' | 'tag' | 'page' | 'pageSize'>>;

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
  const overview =
    !filters.q &&
    !filters.category &&
    !filters.tag &&
    filters.page === 1 &&
    searchParams.get('view') !== 'all';

  const navigate = useCallback(
    (next: Filters, replace = false) => {
      const params = new URLSearchParams();
      if (
        searchParams.get('view') === 'all' ||
        (!next.q && !next.category && !next.tag && filters.page > 1)
      )
        params.set('view', 'all');
      if (next.q) params.set('q', next.q);
      if (next.category) params.set('category', next.category);
      if (next.tag) params.set('tag', next.tag);
      if (next.page > 1) params.set('page', String(next.page));
      const href = `${pathname}${params.size ? `?${params}` : ''}`;
      window.history[replace ? 'replaceState' : 'pushState'](null, '', href);
    },
    [filters.page, pathname, searchParams],
  );

  return (
    <BlogShell
      categories={data?.categories ?? initialData.categories}
      onNavigate={(href) => window.history.pushState(null, '', href)}
    >
      {overview && data ? (
        <div className={styles.overview}>
          <div className={styles.overviewHeading}>
            <h1>추천 글</h1>
            <Link
              className={styles.allPostsLink}
              href="/?view=all"
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                window.history.pushState(null, '', '/?view=all');
              }}
            >
              전체 글 보기
            </Link>
          </div>
          {result.isError ? (
            <div className={styles.state} role="alert">
              <p>글을 불러오지 못했어요.</p>
              <Button onClick={() => result.refetch()}>다시 시도</Button>
            </div>
          ) : data.archive.totalItems === 0 ? (
            <div className={styles.state}>
              <p>아직 공개한 글이 없어요.</p>
            </div>
          ) : null}
          <FeaturedCarousel posts={data.featured} />
          <div className={styles.recentGrid}>
            {data.archive.items.slice(0, 3).map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className={styles.sections}>
            {data.sections
              .filter((section) => section.posts.length)
              .map((section) => (
                <section className={styles.topic} key={section.category.id}>
                  <div className={styles.topicHeading}>
                    <h2>{section.category.name}</h2>
                    <Link
                      href={homeSearchHref({ category: section.category.slug })}
                      onClick={(event) => {
                        if (
                          event.button !== 0 ||
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return;
                        event.preventDefault();
                        navigate({ ...filters, category: section.category.slug, page: 1 });
                      }}
                    >
                      모두 보기
                    </Link>
                  </div>
                  <div className={styles.topicGrid}>
                    {section.posts.map((post) => (
                      <PostCard
                        key={post.slug}
                        post={post}
                        showCategory={false}
                        reserveCoverSpace={section.posts.some((item) =>
                          Boolean(item.cover_image_url),
                        )}
                      />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        </div>
      ) : null}
      {!overview ? (
        <section className={styles.archive} aria-labelledby="archive-title">
          <div className={styles.heading}>
            <div>
              <h1 id="archive-title">전체 글</h1>
              <p>새로 쓴 글부터 차례로 모았어요.</p>
            </div>
          </div>
          {filters.tag && (
            <div className={styles.tagNotice}>
              <span>태그: {filters.tag}</span>
              <button type="button" onClick={() => navigate({ ...filters, tag: '', page: 1 })}>
                태그 필터 지우기
              </button>
            </div>
          )}
          <div>
            {result.isError ? (
              <div className={styles.state} role="alert">
                <p>글을 불러오지 못했어요.</p>
                <Button onClick={() => result.refetch()}>다시 시도</Button>
              </div>
            ) : !data ? (
              <BlogArchiveContentSkeleton showHeading={false} />
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
          </div>
        </section>
      ) : null}
    </BlogShell>
  );
}
