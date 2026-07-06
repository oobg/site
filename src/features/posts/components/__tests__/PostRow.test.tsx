import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostRow } from '@features/posts/components/PostRow';
import type { PostListItem } from '@features/posts/types/posts.types';

const base: PostListItem = {
  slug: '가벼운-헥사고날로-nestjs-나누기',
  title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
  summary: '요약 문장.',
  tags: ['nestjs'],
  published_at: '2026-06-24T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  cover_image_url: null,
  reading_time_min: 8,
  status: 'published',
};

describe('PostRow', () => {
  it('제목과 상세 링크를 렌더한다', () => {
    render(<PostRow post={base} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/blog/가벼운-헥사고날로-nestjs-나누기',
    );
  });
  it('summary가 null이어도 안전하게 렌더한다', () => {
    render(<PostRow post={{ ...base, summary: null }} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
  });
});
