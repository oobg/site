import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@features/posts/services/posts.api', () => ({ getBlogPost: mocks.post }));
import * as legacy from '@/app/blog/[category]/page';

describe('legacy blog redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue({ slug: 'my-post', category: { slug: 'dev' } });
  });

  it('looks up the post and permanently redirects with HTTP 308', async () => {
    await expect(
      legacy.default({ params: Promise.resolve({ category: 'my-post' }) }),
    ).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;replace;/blog/dev/my-post;308;' });
    expect(mocks.post).toHaveBeenCalledWith('my-post');
    expect(legacy).not.toHaveProperty('generateMetadata');
  });

  it('normalizes the old Unicode slug and encodes its canonical destination', async () => {
    mocks.post.mockResolvedValue({ slug: '공개-글', category: { slug: 'dev' } });
    await expect(
      legacy.default({ params: Promise.resolve({ category: encodeURIComponent('공개-글') }) }),
    ).rejects.toMatchObject({
      digest: `NEXT_REDIRECT;replace;/blog/dev/${encodeURIComponent('공개-글')};308;`,
    });
    expect(mocks.post).toHaveBeenCalledWith('공개-글');
  });

  it.each(['%', '%2f', '%5c', '..', '%00'])(
    'returns 404 for unsafe legacy slug %s',
    async (category) => {
      await expect(legacy.default({ params: Promise.resolve({ category }) })).rejects.toMatchObject(
        { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' },
      );
      expect(mocks.post).not.toHaveBeenCalled();
    },
  );

  it('returns 404 when the old post does not exist', async () => {
    mocks.post.mockRejectedValue(
      Object.assign(new Error('not found'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }),
    );
    await expect(
      legacy.default({ params: Promise.resolve({ category: 'missing' }) }),
    ).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });
  });
});
