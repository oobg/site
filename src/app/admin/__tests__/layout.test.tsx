import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getOwnerAccess } = vi.hoisted(() => ({ getOwnerAccess: vi.fn() }));
vi.mock('@lib/auth/owner', () => ({ getOwnerAccess }));
vi.mock('@features/admin/components/AdminAccessBanner', () => ({
  AdminAccessBanner: () => <div>접근 배너</div>,
}));
vi.mock('@features/admin/components/AdminNavigationProvider', () => ({
  AdminNavigationProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@features/admin/components/AdminShell', () => ({
  AdminShell: ({
    authorized,
    banner,
    children,
  }: {
    authorized: boolean;
    banner: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-authorized={authorized}>
      {banner}
      {authorized ? children : null}
    </div>
  ),
}));

import AdminLayout from '@/app/admin/layout';

describe('AdminLayout access gate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('비로그인 또는 권한 없는 상태에서는 관리자 본문을 서버에서 제외한다', async () => {
    getOwnerAccess.mockResolvedValue({
      configured: true,
      authenticated: false,
      authorized: false,
      email: null,
    });
    render(await AdminLayout({ children: <div>보호된 글 목록</div> }));
    expect(screen.getByText('접근 배너')).toBeVisible();
    expect(screen.queryByText('보호된 글 목록')).not.toBeInTheDocument();
  });

  it('owner 판정을 모두 통과한 상태에서만 관리자 본문을 렌더한다', async () => {
    getOwnerAccess.mockResolvedValue({
      configured: true,
      authenticated: true,
      authorized: true,
      email: 'owner@example.test',
    });
    render(await AdminLayout({ children: <div>보호된 글 목록</div> }));
    expect(screen.getByText('보호된 글 목록')).toBeVisible();
  });
});
