import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatestBuild } from '@/app/_components/LatestBuild';
import type { ProjectListItem } from '@features/projects/types/projects.types';

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

describe('LatestBuild', () => {
  it('프로젝트 제목과 상세 링크를 렌더한다', () => {
    render(<LatestBuild project={project} />);
    expect(screen.getByText(project.title)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/raven-api');
  });

  it('project가 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<LatestBuild project={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('cover_image_url이 없으면 이미지를 렌더하지 않는다', () => {
    const { container } = render(<LatestBuild project={{ ...project, cover_image_url: null }} />);
    expect(container.querySelector('img')).toBeNull();
  });

  /* 커버가 있어도 쓰지 않는다. 커버 유무로 레이아웃이 무너지던 구조를 없애면서
     이 구간은 조판만으로 서게 했다. 이미지가 새어 들어오면 그 결정이 깨진다. */
  it('cover_image_url이 있어도 이미지를 렌더하지 않는다', () => {
    const withCover = { ...project, cover_image_url: 'https://cdn.raven.kr/b.png' };
    const { container } = render(<LatestBuild project={withCover} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
