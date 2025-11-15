import { useState, useCallback, useMemo } from 'react';
import { blogApi } from '@src/shared/api/blog';
import type { BlogPostListItem } from '@src/shared/api/mock/factories/blog';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { BlogCategory } from '@src/shared/ui/blog-category';
import { BlogMeta } from '@src/shared/ui/blog-meta';
import { BlogTags } from '@src/shared/ui/blog-tags';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export const BlogListPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: categoriesData } = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: () => blogApi.getCategories(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', 'list', 1, selectedCategory],
    queryFn: () => blogApi.getList(1, 10, selectedCategory),
  });

  const handleCategorySelect = useCallback((category: string | undefined) => {
    setSelectedCategory(category);
  }, []);

  const posts = useMemo(() => data?.data || [], [data?.data]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-400">블로그 목록을 불러오는 중 오류가 발생했습니다.</p>
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
      </div>
    </Container>
  );
};
