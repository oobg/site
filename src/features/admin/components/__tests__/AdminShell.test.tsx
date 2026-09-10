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
    render(
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
});
