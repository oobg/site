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
  it('제목 자체가 상세 링크다', () => {
    render(<PostRow post={base} />);
    // 링크의 이름이 제목이어야 한다. 'Read article' 같은 별도 CTA를 두면 스크린리더가
    // 목록에서 같은 이름의 링크를 여러 개 읽게 되고, 제목은 눌러도 아무 일이 없다.
    const link = screen.getByRole('link', { name: base.title });
    expect(link).toHaveAttribute('href', '/blog/가벼운-헥사고날로-nestjs-나누기');
  });

  it('행에 링크는 하나뿐이다', () => {
    render(<PostRow post={base} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
  it('summary가 null이어도 안전하게 렌더한다', () => {
    render(<PostRow post={{ ...base, summary: null }} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
  });
});
