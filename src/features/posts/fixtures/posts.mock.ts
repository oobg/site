import type { Post, PostListItem } from '@features/posts/types/posts.types';

export const mockPostList: PostListItem[] = [
  {
    slug: '가벼운-헥사고날로-nestjs-나누기',
    title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
    summary: '포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.',
    tags: ['nestjs', 'architecture'],
    published_at: '2026-06-24T00:00:00.000Z',
    updated_at: '2026-07-01T09:12:00.000Z',
    cover_image_url: null,
    reading_time_min: 8,
    status: 'published',
  },
  {
    slug: 'rsc-우선-데이터-패칭',
    title: 'RSC 우선 데이터 패칭 노트',
    summary: null,
    tags: ['nextjs', 'architecture'],
    published_at: '2026-07-03T00:00:00.000Z',
    updated_at: '2026-07-03T00:00:00.000Z',
    cover_image_url: null,
    status: 'published',
  },
];

const body1 = [
  '## 왜 헥사고날인가',
  '',
  '모듈 경계를 지키려면 의존 방향을 한쪽으로 모아야 한다.',
  '',
  '### 포트와 어댑터',
  '',
  '- 포트는 인터페이스',
  '- 어댑터는 구현',
  '',
  '```ts',
  'interface UserPort {',
  '  findById(id: string): Promise<User>;',
  '}',
  '```',
  '',
  '### 트레이드오프',
  '',
  '작은 프로젝트엔 과할 수 있다.',
].join('\n');

const body2 = [
  '## 서버에서 읽고 클라이언트는 최소로',
  '',
  '정적 콘텐츠는 RSC에서 직접 렌더한다.',
  '',
  '### 언제 TanStack Query인가',
  '',
  '검색·필터·폼처럼 상호작용이 생길 때만.',
].join('\n');

export const mockPostDetails: Record<string, Post> = {
  '가벼운-헥사고날로-nestjs-나누기': {
    ...mockPostList[0],
    body_markdown: body1,
    frontmatter: { date: '2026-06-24' },
  },
  'rsc-우선-데이터-패칭': {
    ...mockPostList[1],
    body_markdown: body2,
    frontmatter: { date: '2026-07-03' },
  },
};
