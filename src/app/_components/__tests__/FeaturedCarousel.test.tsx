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
    expect(screen.getByRole('link', { name: '추천 글 1' })).toHaveAttribute(
      'href',
      '/blog/notes/post-1',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders progress in the autoplay control and updates its ten-second countdown', () => {
    vi.useFakeTimers();
    const { rerender } = render(<FeaturedCarousel posts={[1, 2].map(post)} />);

    const progress = screen.getByRole('progressbar', { name: '다음 추천 글 전환까지' });
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(progress).toHaveAttribute('aria-valuetext', '10초 후 전환');

    act(() => vi.advanceTimersByTime(5000));
    expect(progress).toHaveAttribute('aria-valuenow', '50');
    expect(progress).toHaveAttribute('aria-valuetext', '5초 후 전환');

    rerender(<FeaturedCarousel posts={[post(2), post(3)]} />);
    expect(screen.getByRole('progressbar', { name: '다음 추천 글 전환까지' })).toBeInTheDocument();
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

  it('reads the post before its controls and keeps focus on the button that was pressed', () => {
    render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);
    const heading = screen.getByRole('heading', { name: '추천 글 1' });
    const next = screen.getByRole('button', { name: '다음 추천 글' });
    expect(heading.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      screen.getByText('요약 1').compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    next.focus();
    fireEvent.click(next);
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 추천 글' })).toBe(next);
    expect(next).toHaveFocus();
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
    expect(container.querySelector('[data-thumbnail]')).toBeNull();
  });

  it('renders the featured thumbnail directly without a separate media frame', () => {
    const featured = { ...post(1), cover_position: { x: 0.25, y: 0.75 } };
    const { container } = render(<FeaturedCarousel posts={[featured]} />);
    const thumbnail = container.querySelector('[data-thumbnail]');

    expect(container.querySelector('[data-media-frame]')).toBeNull();
    expect(thumbnail?.parentElement?.firstElementChild).toBe(thumbnail);
    expect(thumbnail?.nextElementSibling).toBeTruthy();
    expect(thumbnail).toHaveAttribute('src', '/cover-1.jpg');
    expect(thumbnail).toHaveAttribute('alt', '추천 글 1 표지');
    expect(thumbnail).toHaveAttribute('loading', 'eager');
    expect(thumbnail).toHaveStyle({ objectPosition: '25% 75%' });
  });

  it('announces only the slides the reader moved to, not the automatic ones', () => {
    vi.useFakeTimers();
    const { container } = render(<FeaturedCarousel posts={[1, 2, 3].map(post)} />);
    const live = container.querySelector('[aria-live="polite"]');

    /* 10초마다 말을 걸면 스크린리더 사용자는 글을 읽을 수 없다. */
    expect(live).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('heading', { name: '추천 글 2' })).toBeInTheDocument();
    expect(live).toHaveTextContent('');

    fireEvent.click(screen.getByRole('button', { name: '다음 추천 글' }));
    expect(live).toHaveTextContent('3 / 3 · 추천 글 3');
    fireEvent.click(screen.getByRole('button', { name: '이전 추천 글' }));
    expect(live).toHaveTextContent('2 / 3 · 추천 글 2');
  });

  it('gives the cover a shape before it loads and asks for the first one early', () => {
    const { container } = render(<FeaturedCarousel posts={[post(1), post(3)]} />);
    const image = container.querySelector('img');
    /* 1140 / 600 = 1.9 — .cover의 aspect-ratio와 같다. */
    expect(image).toHaveAttribute('width', '1140');
    expect(image).toHaveAttribute('height', '600');
    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute('decoding', 'async');

    fireEvent.click(screen.getByRole('button', { name: '다음 추천 글' }));
    /* 첫 슬라이드만 LCP 후보다. 뒤 슬라이드까지 우선순위를 올리면 경쟁만 붙는다. */
    expect(container.querySelector('img')).toHaveAttribute('fetchpriority', 'auto');
  });

  it('takes its region name from the visible heading when the page supplies one', () => {
    render(
      <>
        <h2 id="featured-heading">추천 글</h2>
        <FeaturedCarousel posts={[post(1), post(3)]} headingId="featured-heading" />
      </>,
    );
    const region = screen.getByRole('region', { name: '추천 글' });
    expect(region).toHaveAttribute('aria-labelledby', 'featured-heading');
    expect(region).not.toHaveAttribute('aria-label');
  });
});
