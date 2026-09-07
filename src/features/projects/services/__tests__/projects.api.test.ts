import { afterEach, describe, expect, it, vi } from 'vitest';

describe('projects.api', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('글이 supabase 소스여도 프로젝트는 기존 mock 데이터를 유지한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const { getProjects } = await import('@features/projects/services/projects.api');

    const projects = await getProjects();

    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((project) => project.status === 'published')).toBe(true);
  });
});
