import type { Post, PostListItem } from '@features/posts/types/posts.types';

export const mockPostList: PostListItem[] = [
  {
    slug: 'hexagonal-nestjs',
    title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
    summary: '포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.',
    tags: ['nestjs', 'architecture'],
    published_at: '2026-06-24T00:00:00.000Z',
    updated_at: '2026-07-01T09:12:00.000Z',
    cover_image_url: null,
    reading_time_min: 8,
    status: 'published',
  },
];

export const mockPostDetails: Record<string, Post> = {
  'hexagonal-nestjs': {
    ...mockPostList[0],
    body_markdown: '## 왜 헥사고날인가\n\n본문...',
    frontmatter: { date: '2026-06-24', cover: 'cover.png' },
  },
};
