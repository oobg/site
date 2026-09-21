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

/* 컴포넌트가 마운트 직후 모션 축소 설정을 읽는다. jsdom 기본 스텁은 matches:false라
   자동 전환이 켜진 채 시작하고, 이 함수로만 꺼진 환경을 만든다. */
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe('FeaturedCarousel', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not show controls for one featured post', () => {
    render(<FeaturedCarousel posts={[post(1)]} />);
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders progress in the autoplay control and updates its ten-second countdown', () => {
    vi.useFakeTimers();
    const { rerender } = render(<FeaturedCarousel posts={[post(1), post(3)]} />);
    const progress = screen.getByRole('progressbar', { name: '다음 추천 글 전환까지' });

    expect(progress).toHaveAttribute('aria-valuemax', '10000');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    act(() => vi.advanceTimersByTime(5000));
    expect(progress).toHaveAttribute('aria-valuenow', '5000');
    expect(progress).toHaveAttribute('aria-valuetext', '5초 후 전환');

    rerender(<FeaturedCarousel posts={[post(2), post(3)]} />);
    expect(screen.getByRole('progressbar', { name: '다음 추천 글 전환까지' })).toBeInTheDocument();
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

  it('lets a keyboard or touch user stop and restart the ten-second rotation', () => {
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);

    fireEvent.click(screen.getByRole('button', { name: '자동 전환 일시정지' }));
    const resume = screen.getByRole('button', { name: '자동 전환 재생' });
    expect(resume).toHaveAttribute('aria-pressed', 'true');
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();

    /* 버튼에 포커스가 남아 있어도 재생은 곧바로 되살아나야 한다 — 그러지 않으면
       키보드 사용자에게는 재생 버튼이 아무 일도 하지 않는 것처럼 보인다. */
    fireEvent.focus(resume);
    fireEvent.click(resume);
    expect(screen.getByRole('button', { name: '자동 전환 일시정지' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
  });

  it('marks the rotation as paused while it is stopped by the button', () => {
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[post(1), post(3)]} />);
    fireEvent.click(screen.getByRole('button', { name: '자동 전환 일시정지' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '일시정지');
  });

  it('starts with auto-advance off when the reader asks for reduced motion', () => {
    stubReducedMotion(true);
    vi.useFakeTimers();
    render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);

    expect(screen.getByRole('button', { name: '자동 전환 재생' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByRole('heading', { name: '추천 글 1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '자동 전환 재생' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
  });

  it('does not render a broken image when a cover is missing', () => {
    const { container } = render(<FeaturedCarousel posts={[post(2)]} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
