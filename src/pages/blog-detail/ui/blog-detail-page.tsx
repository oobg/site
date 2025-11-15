import { blogApi } from '@src/shared/api/blog';
import { Button } from '@src/shared/ui/button';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { MarkdownRenderer } from '@src/shared/ui/markdown-renderer';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const BlogDetailPage = () => {
  const { title } = useParams<{ title: string }>();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', 'detail', title],
    queryFn: () => {
      if (!title) {
        throw new Error('Blog post title is required');
      }
      const decodedTitle = decodeURIComponent(title);
      return blogApi.getDetail(decodedTitle);
    },
    enabled: !!title,
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <p className="mb-4 text-red-400">블로그 게시글을 불러오는 중 오류가 발생했습니다.</p>
          <Link to="/blog">
            <Button variant="primary">목록으로 돌아가기</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const post = data;

  return (
    <Container className="py-12">
      <Link
        to="/blog"
        className="mb-8 inline-flex items-center gap-2 text-primary-400 transition-colors hover:text-primary-300"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        목록으로
      </Link>
      <div className="space-y-6">
        <Card>
          <div className="space-y-6">
            {post.category && (
              <div>
                <span className="inline-block rounded-md bg-primary-600/80 px-3 py-1 text-xs font-semibold text-white">
                  {post.category}
                </span>
              </div>
            )}
            <h1 className="text-4xl font-bold leading-tight text-white">{post.title}</h1>
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
        <Card>
          <article className="markdown-content-wrapper">
            <MarkdownRenderer content={post.content || ''} />
          </article>
        </Card>
      </div>

      {/* 플로팅 버튼들 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        {/* 위로 올라가는 버튼 */}
        <button
          onClick={scrollToTop}
          className={`rounded-full bg-primary-600 p-4 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-primary-500 hover:shadow-primary-500/50 ${
            showScrollTop
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label="맨 위로 이동"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>

        {/* 목록으로 돌아가는 버튼 */}
        <Link
          to="/blog"
          className="rounded-full bg-primary-600 p-4 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-primary-500 hover:shadow-primary-500/50"
          aria-label="목록으로 돌아가기"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Link>
      </div>
    </Container>
  );
};
