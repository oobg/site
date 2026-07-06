import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import type { Project } from '@features/projects/types/projects.types';
import { mockProjectDetails, mockProjectList } from '@features/projects/fixtures/projects.mock';

export async function getProjects(params: ListParams = {}): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE === 'mock') {
    const items = params.tag
      ? mockProjectList.filter((p) => p.tags.includes(params.tag!))
      : mockProjectList;
    return typeof params.limit === 'number' ? items.slice(0, params.limit) : items;
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

export async function getProject(slug: string): Promise<Project> {
  if (env.CONTENT_SOURCE === 'mock') {
    const project = mockProjectDetails[slug];
    if (!project) notFound();
    return project;
  }
  return apiGet<Project>(`/content/projects/${slug}`, { tags: [`project:${slug}`] });
}
