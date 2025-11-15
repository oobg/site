import { blogApi } from '@src/shared/api/blog';
import { Button } from '@src/shared/ui/button';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { MarkdownRenderer } from '@src/shared/ui/markdown-renderer';
import { convertNotionBlocksToMarkdown } from '@src/shared/utils/notion-to-markdown';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const BlogDetailPage = () => {
  const { title } = useParams<{ title: string }>();
  const [markdownContent, setMarkdownContent] = useState<string>('');

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
    const convertContent = async () => {
      const content = data?.data?.content;
      if (!content || content.length === 0) {
        return;
      }
      const markdown = await convertNotionBlocksToMarkdown(content);
      setMarkdownContent(markdown);
    };
    if (isLoading) {
      return;
    }
    convertContent();
  }, [isLoading]);

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

  const post = data.data;

  return (
    <Container className="py-12">
      <Link to="/blog" className="mb-6 inline-block text-primary-400 hover:text-primary-300">
        ← 목록으로
      </Link>
      <Card>
        <article>
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white">{post.title}</h1>
            {post.category && (
              <span className="rounded-full bg-primary-800/50 px-3 py-1 text-sm text-primary-200">
                {post.category}
              </span>
            )}
          </div>
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-400">
            <span>{new Date(post.created).toLocaleDateString('ko-KR')}</span>
            <span>•</span>
            <span>{post.createdBy}</span>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-primary-900/50 px-3 py-1 text-sm text-primary-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="markdown-content-wrapper">
            <MarkdownRenderer content={markdownContent} />
          </div>
        </article>
      </Card>
    </Container>
  );
};
