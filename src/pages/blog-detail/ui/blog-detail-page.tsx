import { blogApi } from '@shared/api/blog';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { Container } from '@shared/ui/container';
import { LoadingSpinner } from '@shared/ui/loading-spinner';
import { NotionContentRenderer } from '@shared/ui/notion-renderer';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';

export const BlogDetailPage = () => {
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
          <h1 className="mb-4 text-4xl font-bold text-white">{post.title}</h1>
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-400">
            <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            <span>•</span>
            <span>
              {post.readTime}
              분 읽기
            </span>
            <span>•</span>
            <span>{post.author}</span>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-900/50 px-3 py-1 text-sm text-primary-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="notion-content-wrapper">
            <NotionContentRenderer content={post.content} />
          </div>
        </article>
      </Card>
    </Container>
  );
};
