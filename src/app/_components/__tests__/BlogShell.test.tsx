import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlogShell } from '@/app/_components/BlogShell';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));

const categories = [
  { id: 'a', slug: 'ai', name: 'AI', sort_order: 0, is_default: false, post_count: 2 },
  { id: 'b', slug: 'backend', name: '백엔드', sort_order: 1, is_default: false, post_count: 3 },
  { id: 'e', slug: 'empty', name: '빈 카테고리', sort_order: 2, is_default: false, post_count: 0 },
];

describe('BlogShell', () => {
  it('상세에서 홈과 현재 카테고리를 먼저 두고 나머지는 기본 접는다', () => {
    const { container } = render(
      <BlogShell
        categories={categories}
        activeCategory="backend"
        detailNavigation={<nav aria-label="목차">목차 항목</nav>}
        mobileDetailNavigation={
          <details>
            <summary>목차</summary>
          </details>
        }
      >
        본문
      </BlogShell>,
    );
    const sidebar = container.querySelector('aside');
    expect(sidebar).not.toBeNull();
    const links = within(sidebar as HTMLElement).getAllByRole('link');
    expect(links.slice(0, 2).map((link) => link.textContent)).toEqual(['홈', '백엔드']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
    const others = within(sidebar as HTMLElement)
      .getByText('다른 카테고리')
      .closest('details');
    expect(others).not.toHaveAttribute('open');
    expect(within(others as HTMLElement).getByRole('link', { name: 'AI' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByText('빈 카테고리')).not.toBeInTheDocument();
  });
});
