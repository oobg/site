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
        detail
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

  /* 왼쪽 레일은 주제 내비게이션만 맡는다. 목차가 여기 같이 있던 시절에는 레일 하나가
     사이트 안 위치와 글 안 위치를 동시에 말해 위계가 겹쳤다. */
  it('왼쪽 레일에 목차를 두지 않는다', () => {
    const { container } = render(
      <BlogShell
        categories={categories}
        activeCategory="backend"
        detail
        mobileDetailNavigation={<nav aria-label="목차">목차 항목</nav>}
      >
        본문
      </BlogShell>,
    );
    const sidebar = container.querySelector('aside') as HTMLElement;
    expect(within(sidebar).queryByRole('navigation', { name: '목차' })).toBeNull();
    expect(within(sidebar).getByRole('navigation', { name: '블로그 주제' })).toBeInTheDocument();
  });

  /* 레일 이름표가 제목 레지스터로 올라오면 페이지 H1과 어느 쪽이 위인지 흐려진다. */
  it('레일 이름표는 heading이 아니라 보조 레이블이다', () => {
    render(
      <BlogShell categories={categories} detail>
        본문
      </BlogShell>,
    );
    expect(screen.queryByRole('heading', { name: '기술 블로그' })).toBeNull();
  });

  it('목록에서는 카테고리를 접지 않는다', () => {
    const { container } = render(<BlogShell categories={categories}>본문</BlogShell>);
    const sidebar = container.querySelector('aside') as HTMLElement;
    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['홈', 'AI', '백엔드']);
    expect(within(sidebar).queryByText('다른 카테고리')).toBeNull();
  });
});
