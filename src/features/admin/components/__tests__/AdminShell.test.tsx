import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminShell } from '@features/admin/components/AdminShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@features/admin/services/auth.actions', () => ({ signOutAction: vi.fn() }));

describe('AdminShell', () => {
  it('승인된 사용자에게 공통 header, navigation, content를 제공한다', () => {
    const { container } = render(
      <AdminShell
        authorized
        userEmail="owner@example.test"
        banner={<p>상태</p>}
        search={<button>검색</button>}
      >
        <p>내용</p>
      </AdminShell>,
    );
    expect(screen.getByText('raven')).toHaveAttribute('data-site-wordmark');
    expect(screen.getByRole('link', { name: '글' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('main')).toHaveTextContent('내용');
    expect(screen.getByRole('button', { name: '검색' })).toBeVisible();
    expect(screen.getByRole('button', { name: '계정 메뉴' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );

    const banner = screen.getByText('상태');
    const header = container.querySelector('header');
    expect(banner.compareDocumentPosition(header as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('승인되지 않은 사용자에게 banner만 남긴다', () => {
    render(
      <AdminShell authorized={false} banner={<p>로그인 필요</p>}>
        <p>비공개</p>
      </AdminShell>,
    );
    expect(screen.getByText('로그인 필요')).toBeVisible();
    expect(screen.queryByText('비공개')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '관리자 메뉴' })).not.toBeInTheDocument();
  });

  it('desktop viewport에서 navigation과 main을 독립 scroll 영역으로 둔다', () => {
    const css = readFileSync(
      resolve('src/features/admin/components/AdminShell.module.css'),
      'utf8',
    );

    const shellRule = css.match(/\.shell\s*{([^}]*)}/)?.[1];
    expect(shellRule).toMatch(/height:\s*100vh;\s*height:\s*100dvh;/s);
    expect(shellRule).not.toMatch(/min-height:/);
    expect(css).toMatch(
      /\.layout\s*{[^}]*overflow:\s*hidden;[^}]*min-height:\s*0;[^}]*flex:\s*1;/s,
    );
    expect(css).toMatch(/\.nav\s*{[^}]*overflow-y:\s*auto;/s);
    expect(css).toMatch(/\.main\s*{[^}]*overflow:\s*auto;/s);
    expect(css).toMatch(
      /@media \(max-width: 959px\)[\s\S]*\.layout\s*{[^}]*flex-direction:\s*column;[^}]*}[\s\S]*\.nav\s*{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*overflow-x:\s*auto;[^}]*overflow-y:\s*hidden;/,
    );
  });
});
