import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatestWork } from '@/app/_components/LatestWork';
import type { PostListItem } from '@features/posts/types/posts.types';
import type { ProjectListItem } from '@features/projects/types/projects.types';

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

const project: ProjectListItem = {
  slug: 'raven-api',
  title: 'Raven 콘텐츠 API',
  summary: '요약',
  tags: ['nestjs'],
  published_at: '2026-06-24T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
};

describe('LatestWork', () => {
  it('글과 프로젝트가 모두 있으면 두 열을 나란히 렌더한다', () => {
    render(<LatestWork post={post} project={project} />);
    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(screen.getByText(project.title)).toBeInTheDocument();
  });

  it('커버 이미지가 없어도 두 열이 모두 남는다', () => {
    // 커버 부재로 열이 무너지던 것이 홈이 비어 보이던 원인이었다.
    const { container } = render(<LatestWork post={post} project={project} />);
    expect(container.querySelectorAll('article')).toHaveLength(2);
    expect(container.querySelector('img')).toBeNull();
  });

  it('둘 다 없으면 섹션 자체를 렌더하지 않는다', () => {
    const { container } = render(<LatestWork post={null} project={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('하나만 있으면 빈 열을 남기지 않는다', () => {
    const { container } = render(<LatestWork post={post} project={null} />);
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(screen.getByText(post.title)).toBeInTheDocument();
  });
});
