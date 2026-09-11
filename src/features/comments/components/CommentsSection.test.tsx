import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommentsSection } from './CommentsSection';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CommentsSection', () => {
  it('uses the server-provided avatar CDN base', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, nextCursor: null }),
      }),
    );

    const { container } = render(
      <CommentsSection
        slug="avatar-cdn"
        avatarBaseUrl="https://cdn.example.com/assets/comment-avatars/"
      />,
    );

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(
      /^https:\/\/cdn\.example\.com\/assets\/comment-avatars\/clay-\d{2}\.webp$/,
    );
  });
});
