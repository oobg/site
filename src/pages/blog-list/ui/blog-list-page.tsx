import {
  useState, useCallback, useMemo, useEffect,
} from 'react';
import { blogApi } from '@src/shared/api/blog';
import type { BlogPostListItem } from '@src/shared/api/mock/factories/blog';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { LoadingSpinnerSmall } from '@src/shared/ui/loading-spinner-small';
import { BlogCategory } from '@src/shared/ui/blog-category';
import { BlogMeta } from '@src/shared/ui/blog-meta';
import { BlogTags } from '@src/shared/ui/blog-tags';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useIntersectionObserver } from '@src/shared/utils/use-intersection-observer';

export const BlogListPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [observerRef, isIntersecting] = useIntersectionObserver({
    rootMargin: '200px',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: () => blogApi.getCategories(),
  });

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['blog', 'list', selectedCategory],
    queryFn: ({ pageParam = 1 }) => blogApi.getList(pageParam, 10, selectedCategory),
    getNextPageParam: (lastPage) => (
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined
    ),
    initialPageParam: 1,
  });

  // 카테고리 변경 시 스크롤 위치 맨 위로 이동
  // queryKey에 selectedCategory가 포함되어 있어 자동으로 새 쿼리가 시작됨
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  // IntersectionObserver로 하단 감지 시 다음 페이지 로드
  useEffect(() => {
    if (isIntersecting && hasNextPage !== false && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCategorySelect = useCallback((category: string | undefined) => {
    setSelectedCategory(category);
  }, []);

  // 모든 페이지 데이터를 평탄화하여 메모이제이션
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data?.pages],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-400">블로그 목록을 불러오는 중 오류가 발생했습니다.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <Container className="py-12">
      <div className="mb-10">
        <h1 className="mb-6 text-4xl font-bold text-white">Blog</h1>

        {/* 카테고리 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategorySelect(undefined)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === undefined
                ? 'bg-primary-600 text-white'
                : 'bg-primary-900/50 text-primary-200 hover:bg-primary-800/50'
            }`}
          >
            전체
          </button>
          {categoriesData?.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => handleCategorySelect(category.name)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-900/50 text-primary-200 hover:bg-primary-800/50'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post: BlogPostListItem) => (
          <Link key={post.title} to={`/blog/${encodeURIComponent(post.title)}`}>
            <Card hover>
              <div className="space-y-4">
                {post.category && <BlogCategory category={post.category} />}
                <h2 className="text-2xl font-semibold leading-tight text-white">{post.title}</h2>
                <BlogMeta
                  createdBy={post.createdBy}
                  created={post.created}
                  edited={post.edited}
                />
                <BlogTags tags={post.tags} />
              </div>
            </Card>
          </Link>
        ))}

        {/* IntersectionObserver 감지 요소 */}
        <div ref={hasNextPage ? observerRef : null} className="h-1" />

        {/* 추가 로딩 스피너 */}
        {isFetchingNextPage && <LoadingSpinnerSmall />}

        {/* 에러 발생 시 재시도 버튼 */}
        {error && data && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-red-400">다음 페이지를 불러오는 중 오류가 발생했습니다.</p>
            <button
              type="button"
              onClick={() => fetchNextPage()}
              className="rounded-full bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </Container>
  );
};
