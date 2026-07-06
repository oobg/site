import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectHeader } from '@/app/projects/[slug]/_components/ProjectHeader';
import type { Project } from '@features/projects/types/projects.types';

const base: Project = {
  slug: 'raven-api',
  title: 'raven.kr 백엔드 API',
  summary: '멀티테넌트 NestJS API.',
  tags: ['backend'],
  published_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-07-05T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
  body_markdown: '본문',
  frontmatter: {
    role: '1인 개발',
    period: '2026-06 ~ 진행중',
    stack: ['TypeScript', 'NestJS'],
    links: { repo: 'https://github.com/oobg/api', live: 'https://api.raven.kr' },
  },
};

describe('ProjectHeader', () => {
  it('제목과 고유 필드(role·period·stack·links)를 렌더한다', () => {
    render(<ProjectHeader project={base} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(base.title);
    expect(screen.getByText('1인 개발')).toBeInTheDocument();
    expect(screen.getByText('2026-06 ~ 진행중')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /repo/i })).toHaveAttribute(
      'href',
      'https://github.com/oobg/api',
    );
    expect(screen.getByRole('link', { name: /live/i })).toHaveAttribute(
      'href',
      'https://api.raven.kr',
    );
  });

  it('frontmatter가 비면 고유 필드·링크를 생략한다', () => {
    render(<ProjectHeader project={{ ...base, frontmatter: {} }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(base.title);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText('1인 개발')).toBeNull();
  });
});
