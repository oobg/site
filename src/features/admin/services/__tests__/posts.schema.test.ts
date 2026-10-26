import { describe, expect, it } from 'vitest';

import { postIdSchema, postInputSchema } from '@/features/admin/services/posts.schema';

const validPost = {
  title: '첫 글',
  slug: 'first-post',
  description: '설명',
  body: '# 본문',
  status: 'draft',
};

describe('postInputSchema', () => {
  it.each([
    ['title', '가'.repeat(161), '제목은 160자까지 입력할 수 있어요.'],
    ['slug', 'a'.repeat(161), 'URL은 160자까지 입력할 수 있어요.'],
    ['description', '가'.repeat(501), '설명은 500자까지 입력할 수 있어요.'],
    ['tags', ['가'.repeat(81)], '태그는 하나에 80자까지 입력할 수 있어요.'],
    ['tags', Array.from({ length: 31 }, (_, i) => `tag-${i}`), '태그는 30개까지 입력할 수 있어요.'],
    ['cover_image_key', 'a'.repeat(1025), '대표 이미지 경로는 1024자까지 입력할 수 있어요.'],
    ['cover_alt', '가'.repeat(301), '대체 텍스트는 300자까지 입력할 수 있어요.'],
    ['cover_position_x', 1.1, '가로 위치는 1 이하여야 해요.'],
    ['cover_position_y', 1.1, '세로 위치는 1 이하여야 해요.'],
  ] as const)('%s 한도 초과 오류를 한국어로 표시한다', (key, value, message) => {
    const result = postInputSchema.safeParse({ ...validPost, [key]: value });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.message)).toContain(message);
  });
  it('기존 최대 한도값은 그대로 허용한다', () => {
    expect(
      postInputSchema.safeParse({
        ...validPost,
        title: '가'.repeat(160),
        slug: 'a'.repeat(160),
        description: '가'.repeat(500),
        tags: Array.from({ length: 30 }, (_, i) => `${i}`.padEnd(80, 'a')),
        cover_image_key: 'a'.repeat(1024),
        cover_alt: '가'.repeat(300),
        cover_position_x: 1,
        cover_position_y: 1,
      }).success,
    ).toBe(true);
  });

  it('accepts the supported CMS fields', () => {
    expect(postInputSchema.parse(validPost)).toMatchObject({
      ...validPost,
      tags: [],
      cover_image_key: null,
      cover_image_url: null,
      cover_position_x: 0.5,
      cover_position_y: 0.5,
      cover_alt: null,
    });
  });

  it('태그를 소문자 unique 배열로 만들고 cover crop 범위를 검증한다', () => {
    expect(postInputSchema.parse({ ...validPost, tags: 'React, react, NextJS' }).tags).toEqual([
      'react',
      'nextjs',
    ]);
    expect(postInputSchema.safeParse({ ...validPost, cover_position_x: 1.1 }).success).toBe(false);
  });

  it('accepts Korean slugs and normalizes them to NFC', () => {
    const decomposed = '첫-글';
    expect(postInputSchema.parse({ ...validPost, slug: decomposed }).slug).toBe('첫-글');
  });

  it.each(['First-Post', '../first-post', 'first post', 'first_post'])(
    'rejects unsafe slug %s',
    (slug) => {
      expect(postInputSchema.safeParse({ ...validPost, slug }).success).toBe(false);
    },
  );

  it('rejects unsupported publication states', () => {
    expect(postInputSchema.safeParse({ ...validPost, status: 'archived' }).success).toBe(false);
  });
});

describe('postIdSchema', () => {
  it('accepts only UUID post identifiers', () => {
    expect(postIdSchema.safeParse('8e10a748-fd28-41a0-9f3d-8b81fc40c753').success).toBe(true);
    expect(postIdSchema.safeParse('not-an-id').success).toBe(false);
  });
});
