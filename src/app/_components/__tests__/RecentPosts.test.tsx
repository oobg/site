import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RecentPosts } from '@/app/_components/RecentPosts';
import type { PostListItem } from '@features/posts/types/posts.types';

function makePost(slug: string, title: string): PostListItem {
  return {
    slug,
    title,
    summary: '요약',
    tags: ['nextjs'],
    published_at: '2026-06-24T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    cover_image_url: null,
    status: 'published',
  };
}

describe('RecentPosts', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
    localStorage.clear();
  });

  it('글 목록과 상세 링크를 렌더한다', () => {
    render(<RecentPosts posts={[makePost('a', '첫 글'), makePost('b', '둘째 글')]} />);
    expect(screen.getByText('첫 글')).toHaveAttribute('href', '/blog/a');
    expect(screen.getByText('둘째 글')).toHaveAttribute('href', '/blog/b');
  });

  it('글이 없으면 섹션 자체를 렌더하지 않는다', () => {
    const { container } = render(<RecentPosts posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('글이 하나뿐이어도 성립한다', () => {
    // 피처드 한 편을 따로 세우던 구조에서는 이 경우 목록이 비었다.
    const { container } = render(<RecentPosts posts={[makePost('a', '유일한 글')]} />);
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(screen.getByText('유일한 글')).toBeInTheDocument();
  });

  it.each(['{broken', '{"slug":"a"}', '3', '["a", 4]'])(
    '손상된 읽음 기록 %s을 무시한다',
    (stored) => {
      localStorage.setItem('raven:read', stored);
      const { container } = render(<RecentPosts posts={[makePost('a', '첫 글')]} />);
      expect(container.querySelector('li')).not.toHaveAttribute('data-read');
    },
  );

  it('글을 열면 읽음 기록을 저장하고 행에 표시한다', () => {
    const { container } = render(<RecentPosts posts={[makePost('a', '첫 글')]} />);
    const link = screen.getByRole('link', { name: '첫 글' });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(localStorage.getItem('raven:read')).toBe('["a"]');
    expect(container.querySelector('li')).toHaveAttribute('data-read');
  });

  it('j/k와 방향키로 목록을 벗어나지 않고 이동한다', () => {
    const { container } = render(
      <RecentPosts posts={[makePost('a', '첫 글'), makePost('b', '둘째 글')]} />,
    );
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(container.querySelectorAll('li')[1]).toHaveFocus();
    fireEvent.keyDown(window, { key: 'k' });
    expect(container.querySelectorAll('li')[0]).toHaveFocus();
  });

  it('목록을 떠난 뒤 Enter는 이전 활성 글을 열지 않는다', () => {
    render(
      <>
        <RecentPosts posts={[makePost('a', '첫 글')]} />
        <button type="button">다른 동작</button>
      </>,
    );
    const postLink = screen.getByRole('link', { name: '첫 글' });
    const click = vi.spyOn(postLink, 'click');
    fireEvent.keyDown(window, { key: 'j' });
    screen.getByRole('button', { name: '다른 동작' }).focus();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(click).not.toHaveBeenCalled();
  });
});
