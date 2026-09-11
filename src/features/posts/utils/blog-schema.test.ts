import { describe, expect, it } from 'vitest';
import {
  blogPostFiltersSchema,
  blogPostMetadataInputSchema,
  categorySlugSchema,
} from '@features/posts/utils/blog-schema';

describe('blog schema', () => {
  it('카테고리 slug를 비어 있지 않은 소문자 kebab-case로 제한한다', () => {
    expect(categorySlugSchema.safeParse('engineering-notes').success).toBe(true);
    expect(categorySlugSchema.safeParse('').success).toBe(false);
    expect(categorySlugSchema.safeParse('Engineering').success).toBe(false);
  });

  it('cover 위치 범위와 빈 alt를 거절한다', () => {
    const base = { category_id: '00000000-0000-4000-8000-000000000001' };
    expect(blogPostMetadataInputSchema.safeParse({ ...base, cover_position_x: 1.1 }).success).toBe(
      false,
    );
    expect(blogPostMetadataInputSchema.safeParse({ ...base, cover_alt: ' ' }).success).toBe(false);
    expect(blogPostMetadataInputSchema.parse({ ...base, tags: ['React', 'react'] })).toMatchObject({
      category_id: '00000000-0000-4000-8000-000000000001',
      tags: ['react'],
      cover_position_x: 0.5,
      cover_position_y: 0.5,
    });
    expect(
      blogPostMetadataInputSchema.safeParse({
        ...base,
        cover_image_url: 'file:///tmp/cover.png',
      }).success,
    ).toBe(false);
    expect(blogPostMetadataInputSchema.parse(base)).toMatchObject({
      tags: [],
      cover_position_x: 0.5,
      cover_position_y: 0.5,
    });
  });

  it('페이지 크기를 bounded 정수로 검증한다', () => {
    expect(blogPostFiltersSchema.parse({ page: '2', pageSize: '20' })).toMatchObject({
      page: 2,
      pageSize: 20,
    });
    expect(blogPostFiltersSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});
