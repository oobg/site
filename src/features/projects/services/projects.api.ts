import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import type { Project } from '@features/projects/types/projects.types';
import { mockProjectDetails, mockProjectList } from '@features/projects/fixtures/projects.mock';
import { sortContentItems } from '@lib/content/sort';

async function fetchProjects(params: ListParams): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE !== 'api') {
    const filtered = params.tag
      ? mockProjectList.filter((p) => p.tags.includes(params.tag!))
      : mockProjectList;
    const sorted = sortContentItems(filtered, params.sort ?? '-published_at');
    return typeof params.limit === 'number' ? sorted.slice(0, params.limit) : sorted;
  }
  return apiGet<ContentListItem[]>('/content/projects', {
    tags: ['projects'],
    searchParams: {
      tag: params.tag,
      page: params.page,
      limit: params.limit,
      sort: params.sort ?? '-published_at',
    },
  });
}

const getProjectsCached = cache(
  (
    tag: string | undefined,
    page: number | undefined,
    limit: number | undefined,
    sort: ListParams['sort'],
  ) => fetchProjects({ tag, page, limit, sort }),
);

/** 같은 서버 렌더 안의 동일한 목록 요청을 하나로 합친다. */
export function getProjects(params: ListParams = {}): Promise<ContentListItem[]> {
  return getProjectsCached(params.tag, params.page, params.limit, params.sort ?? '-published_at');
}

const getProjectCached = cache(async (slug: string): Promise<Project> => {
  if (env.CONTENT_SOURCE !== 'api') {
    if (!Object.hasOwn(mockProjectDetails, slug)) notFound();
    const project = mockProjectDetails[slug];
    return project;
  }
  if (slug === '.' || slug === '..') notFound();
  return apiGet<Project>(`/content/projects/${encodeURIComponent(slug)}`, {
    tags: [`project:${slug}`],
  });
});

/** generateMetadata와 페이지 본문이 같은 프로젝트를 요청할 때 한 번만 읽는다. */
export function getProject(slug: string): Promise<Project> {
  return getProjectCached(slug);
}
