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
      <div className="mb-10">
        <h1 className="mb-6 text-4xl font-bold text-white">Blog</h1>

        {/* 카테고리 필터 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
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
              type="button"
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

      <div className="flex flex-col gap-4">
        {data?.data.map((post: BlogPostListItem) => (
          <Link key={post.title} to={`/blog/${encodeURIComponent(post.title)}`}>
            <Card hover>
              <div className="space-y-4">
                {post.category && (
                  <div>
                    <span className="inline-block rounded-md bg-primary-600/80 px-3 py-1 text-xs font-semibold text-white">
                      {post.category}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-semibold leading-tight text-white">{post.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-1.5">
                    <svg
                      className="h-4 w-4 text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium text-gray-300">{post.createdBy}</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">
                    {new Date(post.created).toLocaleDateString('ko-KR')}
                  </span>
                  {post.edited && post.edited !== post.created && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        수정: {new Date(post.edited).toLocaleDateString('ko-KR')}
                      </span>
                    </>
                  )}
                </div>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-md border border-gray-600/50 bg-gray-800/30 px-2.5 py-1 text-xs text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
};
