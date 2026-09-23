'use client';

import { useCallback, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@components/ui/Button';
import { FeaturedCarousel } from '@/app/_components/FeaturedCarousel';
import { BlogShell } from '@/app/_components/BlogShell';
import { BlogArchiveContentSkeleton } from '@/app/_components/BlogLoadingSkeleton';
import { PostCard } from '@features/posts/components/PostCard';
import { useBlogPosts } from '@features/posts/services/use-blog-posts';
import { planHomeSections } from '@features/posts/utils/home-sections';
import type { BlogHomeData, BlogPostFilters } from '@features/posts/types/posts.types';
import { homeSearchHref } from '@constants/routes';
import styles from './BlogHomeContainer.module.css';

type Filters = Required<Pick<BlogPostFilters, 'q' | 'category' | 'tag' | 'page' | 'pageSize'>>;

const RECENT_COUNT = 3;
const FEATURED_HEADING_ID = 'home-featured-heading';

/** 새 탭·새 창을 여는 클릭은 가로채지 않는다. 가로채면 링크가 링크가 아니게 된다. */
function opensElsewhere(event: React.MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

interface ActiveFilter {
  key: string;
  label: string;
  clearLabel: string;
  next: Filters;
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
  const overview =
    !filters.q &&
    !filters.category &&
    !filters.tag &&
    filters.page === 1 &&
    searchParams.get('view') !== 'all';
  /* 목록이 바뀐 뒤 화면을 그 머리로 되돌린다. 페이지를 넘겼는데 스크롤이 그대로면
     같은 자리에 다른 글이 나타나고, 그러면 "넘어갔다"는 신호가 아무 데도 없다. */
  const archiveRef = useRef<HTMLElement>(null);

  const hrefFor = useCallback(
    (next: Filters) => {
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
      return `${pathname}${params.size ? `?${params}` : ''}`;
    },
    [filters.page, pathname, searchParams],
  );

  const navigate = useCallback(
    (next: Filters, replace = false) => {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', hrefFor(next));
    },
    [hrefFor],
  );

  const scrollToResults = useCallback(() => {
    const node = archiveRef.current;
    /* jsdom을 비롯해 scrollIntoView가 없는 환경이 있다 — 이동 자체를 막지는 않는다. */
    if (!node || typeof node.scrollIntoView !== 'function') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  const categories = data?.categories ?? initialData.categories;
  const categoryName =
    categories.find((item) => item.slug === filters.category)?.name || filters.category;

  /* 제목이 URL을 그대로 말한다. "전체 글"이 검색 결과 위에 떠 있으면 필터가
     걸렸다는 사실을 화면 어디서도 읽을 수 없다. */
  const archiveTitle = filters.q
    ? `‘${filters.q}’ 검색 결과`
    : filters.category
      ? categoryName
      : filters.tag
        ? `#${filters.tag}`
        : '전체 글';

  const activeFilters: ActiveFilter[] = [];
  if (filters.q)
    activeFilters.push({
      key: 'q',
      label: `검색: ${filters.q}`,
      clearLabel: '검색어 지우기',
      next: { ...filters, q: '', page: 1 },
    });
  if (filters.category)
    activeFilters.push({
      key: 'category',
      label: `카테고리: ${categoryName}`,
      clearLabel: '카테고리 필터 지우기',
      next: { ...filters, category: '', page: 1 },
    });
  if (filters.tag)
    activeFilters.push({
      key: 'tag',
      label: `태그: ${filters.tag}`,
      clearLabel: '태그 필터 지우기',
      next: { ...filters, tag: '', page: 1 },
    });

  const pageLink = (targetPage: number, label: string, available: boolean) => {
    if (!available)
      return (
        <span className={styles.pageStep} data-disabled="" aria-hidden="true">
          {label}
        </span>
      );
    return (
      <Link
        className={styles.pageStep}
        href={hrefFor({ ...filters, page: targetPage })}
        onClick={(event) => {
          if (opensElsewhere(event)) return;
          event.preventDefault();
          navigate({ ...filters, page: targetPage });
          scrollToResults();
        }}
      >
        {label}
      </Link>
    );
  };

  const errorState = (
    <div className={styles.state} role="alert">
      <p>글을 불러오지 못했어요.</p>
      <Button onClick={() => result.refetch()}>다시 시도</Button>
    </div>
  );

  /* 추천·최근·카테고리 섹션이 같은 글을 되풀이하지 않도록 그리는 순서대로 한 번씩만
     배정한다. 추천 글과 목록이 따로 있으면 같은 글이 두 번 보인다 — 글이 하나뿐일 때도. */
  const home = data
    ? planHomeSections(
        { featured: data.featured, latest: data.archive.items, sections: data.sections },
        { recentCount: RECENT_COUNT },
      )
    : { featured: [], recent: [], sections: [] };
  const hasOverviewContent = Boolean(
    data &&
    (data.archive.totalItems > 0 ||
      data.featured.length > 0 ||
      data.sections.some((section) => section.posts.length > 0)),
  );

  return (
    <BlogShell
      categories={categories}
      activeCategory={category || undefined}
      onNavigate={(href) => window.history.pushState(null, '', href)}
    >
      {overview ? (
        <div className={styles.overview}>
          <div className={styles.overviewHeading}>
            <h1>기술 블로그</h1>
            <Link
              className={styles.allPostsLink}
              href="/?view=all"
              onClick={(event) => {
                if (opensElsewhere(event)) return;
                event.preventDefault();
                window.history.pushState(null, '', '/?view=all');
              }}
            >
              전체 글 보기
            </Link>
          </div>
          {/* 실패했을 때 옛 목록을 같이 띄우면 그게 지금 상태인 줄 안다. 하나만 보인다. */}
          {result.isError ? (
            errorState
          ) : !data ? (
            <BlogArchiveContentSkeleton showHeading={false} />
          ) : !hasOverviewContent ? (
            <div className={styles.state} role="status" aria-live="polite">
              <p>아직 공개한 글이 없어요.</p>
            </div>
          ) : (
            <>
              {home.featured.length > 0 ? (
                <>
                  <h2 className={styles.sectionLabel} id={FEATURED_HEADING_ID}>
                    추천 글
                  </h2>
                  <FeaturedCarousel posts={home.featured} headingId={FEATURED_HEADING_ID} />
                </>
              ) : null}
              {home.recent.length > 0 ? (
                <section className={styles.recent} aria-labelledby="home-recent-heading">
                  <h2 className={styles.sectionLabel} id="home-recent-heading">
                    최근 글
                  </h2>
                  <div className={styles.recentGrid}>
                    {home.recent.map((post) => (
                      <PostCard
                        key={post.slug}
                        post={post}
                        headingLevel={3}
                        reserveCoverSpace={true}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              <div className={styles.sections}>
                {home.sections.map((section) => (
                  <section className={styles.topic} key={section.category.id}>
                    <div className={styles.topicHeading}>
                      <h2>{section.category.name}</h2>
                      <Link
                        href={homeSearchHref({ category: section.category.slug })}
                        onClick={(event) => {
                          if (opensElsewhere(event)) return;
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
                          headingLevel={3}
                          showCategory={false}
                          reserveCoverSpace={true}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
      {!overview ? (
        <section className={styles.archive} aria-labelledby="archive-title" ref={archiveRef}>
          <div className={styles.heading}>
            <div>
              <h1 id="archive-title">{archiveTitle}</h1>
              {activeFilters.length === 0 ? <p>새로 쓴 글부터 차례로 모았어요.</p> : null}
            </div>
          </div>
          {activeFilters.length > 0 && (
            <div className={styles.filters}>
              <div className={styles.filterChips}>
                {activeFilters.map((filter) => (
                  <span className={styles.filterChip} key={filter.key}>
                    <span>{filter.label}</span>
                    <button
                      type="button"
                      aria-label={filter.clearLabel}
                      onClick={() => navigate(filter.next)}
                    >
                      지우기
                    </button>
                  </span>
                ))}
              </div>
              {data && data.archive.totalItems > 0 ? (
                <p className={styles.resultCount} role="status">
                  글 {data.archive.totalItems}개
                </p>
              ) : null}
            </div>
          )}
          <div>
            {result.isError ? (
              errorState
            ) : !data ? (
              <BlogArchiveContentSkeleton showHeading={false} />
            ) : data.archive.items.length === 0 ? (
              <div className={styles.state} role="status" aria-live="polite">
                <p>
                  {activeFilters.length > 0
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
                      reserveCoverSpace={true}
                      /* 한 카테고리만 보는 목록에서는 제목·사이드바·필터가 이미 그 이름을
                         말한다. 카드마다 같은 이름을 또 달면 열 번 넘게 반복된다. */
                      showCategory={!filters.category}
                    />
                  ))}
                </div>
                {data.archive.totalPages > 1 && (
                  <nav className={styles.pagination} aria-label="글 페이지">
                    {pageLink(filters.page - 1, '이전', filters.page > 1)}
                    <span>
                      <strong>{data.archive.page}</strong> / {data.archive.totalPages}
                    </span>
                    {pageLink(filters.page + 1, '다음', filters.page < data.archive.totalPages)}
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
