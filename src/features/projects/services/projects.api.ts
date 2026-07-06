import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import type { Project } from '@features/projects/types/projects.types';
import { mockProjectDetails, mockProjectList } from '@features/projects/fixtures/projects.mock';

function sortItems(items: ContentListItem[], sort: string): ContentListItem[] {
  const desc = sort.startsWith('-');
  const key = (desc ? sort.slice(1) : sort) as keyof ContentListItem;
  return [...items].sort((a, b) => {
    const av = String(a[key] ?? '');
    const bv = String(b[key] ?? '');
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });
}

export async function getProjects(params: ListParams = {}): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE === 'mock') {
    const filtered = params.tag
      ? mockProjectList.filter((p) => p.tags.includes(params.tag!))
      : mockProjectList;
    const sorted = sortItems(filtered, params.sort ?? '-published_at');
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

export async function getProject(slug: string): Promise<Project> {
  if (env.CONTENT_SOURCE === 'mock') {
    const project = mockProjectDetails[slug];
    if (!project) notFound();
    return project;
  }
  return apiGet<Project>(`/content/projects/${slug}`, { tags: [`project:${slug}`] });
}
