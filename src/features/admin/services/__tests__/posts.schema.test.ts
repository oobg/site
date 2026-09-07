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
  it('accepts the supported CMS fields', () => {
    expect(postInputSchema.parse(validPost)).toEqual(validPost);
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
