import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleAside } from '@/app/blog/[slug]/_components/ArticleAside';
import { PostNav } from '@/app/blog/[slug]/_components/PostNav';
import type { PostListItem } from '@features/posts/types/posts.types';

const post: PostListItem = {
  slug: 'my-post',
  title: '개발 글',
  summary: null,
  tags: [],
  published_at: '2026-09-10T00:00:00Z',
  updated_at: '2026-09-10T00:00:00Z',
  cover_image_url: null,
  status: 'published',
  category: { slug: 'dev' },
};

describe('article post links', () => {
  it('only explains a relationship supported by actual shared tags or category', () => {
    render(
      <ArticleAside
        currentPost={{ ...post, tags: ['NextJS'] }}
        related={[
          { ...post, slug: 'tag', title: '태그가 같은 글', tags: ['nextjs'] },
          { ...post, slug: 'category', title: '주제가 같은 글', tags: [] },
          { ...post, slug: 'fallback', title: '별도 글', tags: [], category: { slug: 'notes' } },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /태그가 같은 글/ })).toHaveTextContent(
      '같은 태그 #nextjs',
    );
    expect(screen.getByRole('link', { name: /주제가 같은 글/ })).toHaveTextContent(
      '같은 주제의 글',
    );
    expect(screen.getByRole('link', { name: /별도 글/ })).not.toHaveTextContent('같은');
  });
  it('preserves the category for related posts and falls back for legacy items', () => {
    render(
      <ArticleAside
        related={[post, { ...post, slug: 'legacy', title: '구형 글', category: undefined }]}
      />,
    );
    expect(screen.getByRole('link', { name: /개발 글/ })).toHaveAttribute(
      'href',
      '/blog/dev/my-post',
    );
    expect(screen.getByRole('link', { name: /구형 글/ })).toHaveAttribute(
      'href',
      `/blog/${encodeURIComponent('미분류')}/legacy`,
    );
  });

  it('uses each adjacent post category independently', () => {
    render(
      <PostNav prev={post} next={{ ...post, slug: 'next-post', category: { slug: 'notes' } }} />,
    );
    expect(screen.getByRole('link', { name: /이전 글/ })).toHaveAttribute(
      'href',
      '/blog/dev/my-post',
    );
    expect(screen.getByRole('link', { name: /다음 글/ })).toHaveAttribute(
      'href',
      '/blog/notes/next-post',
    );
  });

  it('supports legacy adjacent posts with the default category', () => {
    render(<PostNav prev={{ ...post, category: undefined }} next={null} />);
    expect(screen.getByRole('link', { name: /이전 글/ })).toHaveAttribute(
      'href',
      `/blog/${encodeURIComponent('미분류')}/my-post`,
    );
  });
});
