import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatestThinking } from '@/app/_components/LatestThinking';
import type { PostListItem } from '@features/posts/types/posts.types';

const post: PostListItem = {
  slug: 'hexagonal-nestjs',
  title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
  summary: '요약',
  tags: ['nestjs'],
  published_at: '2026-06-24T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
};

describe('LatestThinking', () => {
  it('글 제목과 상세 링크를 렌더한다', () => {
    render(<LatestThinking post={post} />);
    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/hexagonal-nestjs');
  });

  it('post가 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<LatestThinking post={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
