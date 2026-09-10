import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/' } }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));
vi.mock('@/app/_components/SiteHeader', () => ({ SiteHeader: () => <header>공개 헤더</header> }));
vi.mock('@/app/_components/SiteFooter', () => ({ SiteFooter: () => <footer>공개 푸터</footer> }));

import { PublicChrome } from '@/app/_components/PublicChrome';

describe('PublicChrome', () => {
  beforeEach(() => {
    pathname.current = '/';
  });

  it('공개 경로에는 읽기용 헤더와 푸터를 렌더한다', () => {
    render(<PublicChrome>본문</PublicChrome>);
    expect(screen.getByText('공개 헤더')).toBeVisible();
    expect(screen.getByText('공개 푸터')).toBeVisible();
    expect(screen.getByRole('main')).toHaveTextContent('본문');
  });

  it('관리자 경로에는 공개 크롬을 마운트하지 않는다', () => {
    pathname.current = '/admin/posts/new';
    render(<PublicChrome>관리자 셸</PublicChrome>);
    expect(screen.queryByText('공개 헤더')).not.toBeInTheDocument();
    expect(screen.queryByText('공개 푸터')).not.toBeInTheDocument();
    expect(screen.getByText('관리자 셸')).toBeVisible();
  });
});
