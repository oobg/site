import type { Project, ProjectListItem } from '@features/projects/types/projects.types';

export const mockProjectList: ProjectListItem[] = [
  {
    slug: 'raven-api',
    title: 'raven.kr 백엔드 API',
    summary: '멀티테넌트 NestJS API를 개인 홈서버에서 운영.',
    tags: ['backend'],
    published_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-07-05T00:00:00.000Z',
    cover_image_url: null,
    status: 'published',
  },
];

export const mockProjectDetails: Record<string, Project> = {
  'raven-api': {
    ...mockProjectList[0],
    body_markdown: '프로젝트 회고 본문...',
    frontmatter: {
      role: '1인 개발',
      period: '2026-06 ~ 진행중',
      stack: ['TypeScript', 'NestJS', 'Prisma', 'Supabase'],
      links: { repo: 'https://github.com/oobg/api', live: 'https://api.raven.kr' },
    },
  },
};
