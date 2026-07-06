import { queryOptions } from '@tanstack/react-query';
import type { ListParams } from '@lib/api/contract.types';
import { getProject, getProjects } from '@features/projects/services/projects.api';

export function projectsQueryOptions(params: ListParams = {}) {
  return queryOptions({ queryKey: ['projects', params], queryFn: () => getProjects(params) });
}

export function projectQueryOptions(slug: string) {
  return queryOptions({ queryKey: ['project', slug], queryFn: () => getProject(slug) });
}
