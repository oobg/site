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
    role: '백엔드 개발',
    period: '2026-06 ~ 진행중',
    stack: ['TypeScript', 'NestJS'],
    links: { repo: 'https://github.com/example-org/example-api', live: 'https://api.raven.kr' },
  },
};

describe('ProjectHeader', () => {
  it('제목과 고유 필드(role·period·stack·links)를 렌더한다', () => {
    render(<ProjectHeader project={base} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(base.title);
    expect(screen.getByText('백엔드 개발')).toBeInTheDocument();
    expect(screen.getByText('2026-06 ~ 진행중')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /repo/i })).toHaveAttribute(
      'href',
      'https://github.com/example-org/example-api',
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
    expect(screen.queryByText('백엔드 개발')).toBeNull();
  });

  it('잘못된 frontmatter 값은 안전하게 생략하고 유효한 stack 문자열만 남긴다', () => {
    render(
      <ProjectHeader
        project={{
          ...base,
          frontmatter: {
            role: { unexpected: true },
            period: null,
            stack: ['TypeScript', null, 42, 'NestJS'],
            links: { repo: 'javascript:alert(1)', live: '/projects/raven-api' },
          },
        }}
      />,
    );

    expect(screen.queryByText('Role')).toBeNull();
    expect(screen.queryByText('Period')).toBeNull();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Repo' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Live' })).toHaveAttribute(
      'href',
      '/projects/raven-api',
    );
  });

  it('frontmatter가 null 또는 배열이어도 기본 메타만 렌더한다', () => {
    const { rerender } = render(
      <ProjectHeader project={{ ...base, frontmatter: null as never }} />,
    );
    expect(screen.queryByText('Role')).toBeNull();

    rerender(<ProjectHeader project={{ ...base, frontmatter: [] as never }} />);
    expect(screen.queryByText('Stack')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
