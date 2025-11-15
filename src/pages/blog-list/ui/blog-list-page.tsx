import { blogApi } from '@src/shared/api/blog';
import type { BlogPostListItem } from '@src/shared/api/mock/factories/blog';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
      <h1 className="mb-8 text-4xl font-bold text-white">Blog</h1>

      {/* 카테고리 필터 버튼 */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
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
              onClick={() => setSelectedCategory(category.name)}
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

      <div className="space-y-3 flex flex-col">
        {data?.data.map((post: BlogPostListItem) => (
          <Link key={post.title} to={`/blog/${encodeURIComponent(post.title)}`}>
            <Card hover>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-white">{post.title}</h2>
                {post.category && (
                  <span className="rounded-full bg-primary-800/50 px-3 py-1 text-sm text-primary-200">
                    {post.category}
                  </span>
                )}
              </div>
              <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                <span>{new Date(post.created).toLocaleDateString('ko-KR')}</span>
                <span>•</span>
                <span>{post.createdBy}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary-900/50 px-3 py-1 text-sm text-primary-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
};
