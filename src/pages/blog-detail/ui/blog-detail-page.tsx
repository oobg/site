import React, { useMemo } from 'react';
import { blogApi } from '@src/shared/api/blog';
import { Button } from '@src/shared/ui/button';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { MarkdownRenderer } from '@src/shared/ui/markdown-renderer';
import { BlogCategory } from '@src/shared/ui/blog-category';
import { BlogMeta } from '@src/shared/ui/blog-meta';
import { BlogTags } from '@src/shared/ui/blog-tags';
import { ScrollToTop } from '@src/shared/ui/scroll-to-top';
import { ArrowLeftIcon, MenuIcon } from '@src/shared/ui/icons';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useScrollToHash } from '@src/app/providers/scroll-restoration';

export const BlogDetailPage = React.memo(() => {
  const { title } = useParams<{ title: string }>();

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

  // 데이터 로딩이 완료된 후에만 해시 스크롤 실행
  useScrollToHash(!isLoading && !!data);

  const postContent = useMemo(() => data?.content || '', [data?.content]);

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
        <ArrowLeftIcon />
        목록으로
      </Link>
      <div className="space-y-6">
        <Card>
          <div className="space-y-6">
            {post.category && <BlogCategory category={post.category} />}
            <h1 className="text-4xl font-bold leading-tight text-white">{post.title}</h1>
            <BlogMeta
              createdBy={post.createdBy}
              created={post.created}
              edited={post.edited}
            />
            <BlogTags tags={post.tags} />
          </div>
        </Card>
        <Card>
          <article className="markdown-content-wrapper">
            <MarkdownRenderer content={postContent} />
          </article>
        </Card>
      </div>

      {/* 플로팅 버튼들 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        <ScrollToTop />
        <Link
          to="/blog"
          className="rounded-full bg-primary-600 p-4 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-primary-500 hover:shadow-primary-500/50"
          aria-label="목록으로 돌아가기"
        >
          <MenuIcon />
        </Link>
      </div>
    </Container>
  );
});

BlogDetailPage.displayName = 'BlogDetailPage';
