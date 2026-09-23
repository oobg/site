import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  project: vi.fn(),
  projects: vi.fn(),
}));
vi.mock('@features/projects/services/projects.api', () => ({
  getProject: mocks.project,
  getProjects: mocks.projects,
}));
vi.mock('@lib/markdown/render', () => ({ renderMarkdown: vi.fn() }));

import { PROJECTS_INDEXABLE } from '@features/projects/constants/projects.visibility';
import { metadata as listMetadata } from '@/app/(projects)/projects/page';
import { generateMetadata } from '@/app/projects/[slug]/page';

/* 공개 여부가 정해질 때까지 프로젝트는 페이지만 열고 색인에서 뺀다. */
describe('projects metadata while hidden', () => {
  it('the visibility switch is off', () => {
    expect(PROJECTS_INDEXABLE).toBe(false);
  });

  it('marks the list page noindex, nofollow', () => {
    expect(listMetadata.robots).toEqual({ index: false, follow: false });
    expect(listMetadata.title).toBe('프로젝트');
  });

  it('marks the detail page noindex, nofollow and keeps its canonical', async () => {
    mocks.project.mockResolvedValue({ slug: 'raven-api', title: 'raven API', summary: '요약' });
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'raven-api' }) });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toBe('raven API');
    expect(metadata.alternates?.canonical).toBe('/projects/raven-api');
  });
});
