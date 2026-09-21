import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@features/posts/services/posts.api', () => ({ getBlogPost: mocks.post }));

import Page from '@/app/blog/[slug]/[legacySlug]/page';

const post = { slug: 'my-post' };
const params = (category = 'dev', legacySlug = 'my-post') =>
  Promise.resolve({ slug: category, legacySlug });

describe('legacy /blog/{category}/{slug}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue(post);
  });

  it('옛 두 세그먼트 주소를 현재 canonical로 308 이동시킨다', async () => {
    await expect(Page({ params: params() })).rejects.toMatchObject({
      digest: 'NEXT_REDIRECT;replace;/blog/my-post;308;',
    });
  });

  it('카테고리가 무엇이든 글 키만으로 canonical을 정한다', async () => {
    await expect(Page({ params: params('이미-사라진-카테고리') })).rejects.toMatchObject({
      digest: 'NEXT_REDIRECT;replace;/blog/my-post;308;',
    });
    expect(mocks.post).toHaveBeenCalledWith('my-post');
  });

  it('percent 인코딩된 한글 키를 풀어 조회하고 인코딩된 canonical로 보낸다', async () => {
    mocks.post.mockResolvedValue({ slug: '공개-글' });
    await expect(
      Page({ params: params('%EA%B0%9C%EB%B0%9C', encodeURIComponent('공개-글')) }),
    ).rejects.toMatchObject({
      digest: `NEXT_REDIRECT;replace;/blog/${encodeURIComponent('공개-글')};308;`,
    });
    expect(mocks.post).toHaveBeenCalledWith('공개-글');
  });

  it.each(['%', '%2f', '%5c', '..', '%252e%252e', '%00', ''])(
    '안전하지 않은 글 키 %j는 조회 전에 404다',
    async (value) => {
      await expect(Page({ params: params('dev', value) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      expect(mocks.post).not.toHaveBeenCalled();
    },
  );

  it.each(['%', '%2f', '..', '%00'])(
    '안전하지 않은 카테고리 %j도 조회 전에 404다',
    async (value) => {
      await expect(Page({ params: params(value) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      expect(mocks.post).not.toHaveBeenCalled();
    },
  );

  it('없는 글은 리다이렉트하지 않고 404를 올린다', async () => {
    mocks.post.mockRejectedValue(
      Object.assign(new Error('not found'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }),
    );
    await expect(Page({ params: params() })).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
  });
});
