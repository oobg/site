import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@features/projects/components/ProjectCard';
import type { ProjectListItem } from '@features/projects/types/projects.types';

const base: ProjectListItem = {
  slug: 'raven-api',
  title: 'raven.kr 백엔드 API',
  summary: '멀티테넌트 NestJS API.',
  tags: ['backend'],
  published_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-07-05T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
};

describe('ProjectCard', () => {
  it('제목·요약·태그·상세 링크를 렌더한다', () => {
    render(<ProjectCard project={base} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
    expect(screen.getByText('멀티테넌트 NestJS API.')).toBeInTheDocument();
    expect(screen.getByText('#backend')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/raven-api');
  });

  it('cover가 있으면 img를, 없으면 img를 렌더하지 않는다', () => {
    const { rerender } = render(<ProjectCard project={base} />);
    expect(screen.queryByRole('img')).toBeNull();
    rerender(<ProjectCard project={{ ...base, cover_image_url: 'https://example.com/c.png' }} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/c.png');
  });

  it('summary가 null이어도 안전하게 렌더한다', () => {
    render(<ProjectCard project={{ ...base, summary: null }} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
  });
});
