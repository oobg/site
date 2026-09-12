import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeaturedCarousel } from '@/app/_components/FeaturedCarousel';
import type { BlogPostSummary } from '@features/posts/types/posts.types';

function post(index: number): BlogPostSummary {
  return {
    slug: `post-${index}`,
    title: `추천 글 ${index}`,
    summary: `요약 ${index}`,
    tags: [],
    published_at: '2026-09-10T00:00:00.000Z',
    updated_at: '2026-09-10T00:00:00.000Z',
    cover_image_url: index % 2 ? `/cover-${index}.jpg` : null,
    status: 'published',
    category: { id: 'category', slug: 'notes', name: '노트', sort_order: 0, is_default: false },
    cover_image_key: null,
    cover_position: { x: 0.5, y: 0.5 },
    cover_alt: `추천 글 ${index} 표지`,
    pin_order: index,
  };
}

describe('FeaturedCarousel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show controls for one featured post', () => {
    render(<FeaturedCarousel posts={[post(1)]} />);
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '추천 글 1' })).toHaveAttribute(
      'href',
      '/blog/notes/post-1',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders and ticks progress only when the active post has a cover', () => {
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[1, 2].map(post)} />);

    const progress = screen.getByRole('progressbar', { name: '다음 추천 글 전환까지' });
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(progress).toHaveAttribute('aria-valuetext', '10초 후 전환');

    act(() => vi.advanceTimersByTime(5000));
    expect(progress).toHaveAttribute('aria-valuenow', '50');
    expect(progress).toHaveAttribute('aria-valuetext', '5초 후 전환');

    fireEvent.click(screen.getByRole('button', { name: '다음 추천 글' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('supports manual navigation and clamps the current slide when results shrink', () => {
    const five = [1, 2, 3, 4, 5].map(post);
    const { rerender } = render(<FeaturedCarousel posts={five} />);
    fireEvent.click(screen.getByRole('button', { name: '이전 추천 글' }));
    expect(screen.getByRole('heading', { name: '추천 글 5' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '추천 글 5' })).toHaveAttribute(
      'href',
      '/blog/notes/post-5',
    );
    rerender(<FeaturedCarousel posts={five.slice(0, 2)} />);
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('moves to the next post every ten seconds and pauses while it is being read', () => {
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);
    const section = screen.getByRole('region', { name: '추천 글' });

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();

    fireEvent.mouseEnter(section);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '일시정지');
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();
    fireEvent.mouseLeave(section);
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 3' })).toBeInTheDocument();
  });

  it('pauses autoplay while focus remains inside the carousel', () => {
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);
    const next = screen.getByRole('button', { name: '다음 추천 글' });

    fireEvent.focus(next);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();

    fireEvent.blur(next, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
  });

  it('does not render a broken image when a cover is missing', () => {
    const { container } = render(<FeaturedCarousel posts={[post(2)]} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
