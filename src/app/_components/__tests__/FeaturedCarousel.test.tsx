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
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders progress only over a cover image and updates its ten-second countdown', () => {
    vi.useFakeTimers();
    const { rerender } = render(<FeaturedCarousel posts={[post(1), post(3)]} />);
    const progress = screen.getByRole('progressbar', { name: '다음 추천 글 전환까지' });

    expect(progress).toHaveAttribute('aria-valuemax', '10000');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    act(() => vi.advanceTimersByTime(5000));
    expect(progress).toHaveAttribute('aria-valuenow', '5000');
    expect(progress).toHaveAttribute('aria-valuetext', '5초 후 전환');

    rerender(<FeaturedCarousel posts={[post(2), post(3)]} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('supports manual navigation and clamps the current slide when results shrink', () => {
    const five = [1, 2, 3, 4, 5].map(post);
    const { rerender } = render(<FeaturedCarousel posts={five} />);
    fireEvent.click(screen.getByRole('button', { name: '이전 추천 글' }));
    expect(screen.getByRole('heading', { name: '추천 글 5' })).toBeInTheDocument();
    rerender(<FeaturedCarousel posts={five.slice(0, 2)} />);
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('moves to the next post every ten seconds and pauses while it is being read', () => {
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);
    const section = screen.getByRole('region', { name: '추천 글' });

    act(() => vi.advanceTimersByTime(9999));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();

    fireEvent.mouseEnter(section);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
    fireEvent.mouseLeave(section);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 3' })).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: '다음 추천 글' });
    fireEvent.focus(nextButton);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 3' })).toBeInTheDocument();
    fireEvent.blur(nextButton);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();
  });

  it('does not render a broken image when a cover is missing', () => {
    const { container } = render(<FeaturedCarousel posts={[post(2)]} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
