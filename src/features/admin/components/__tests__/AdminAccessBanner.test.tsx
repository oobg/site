import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminAccessBanner } from '@features/admin/components/AdminAccessBanner';

vi.mock('@features/admin/components/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <button>Google 계정으로 계속하기</button>,
}));
vi.mock('@features/admin/services/auth.actions', () => ({ signOutAction: vi.fn() }));

describe('AdminAccessBanner', () => {
  it('비로그인 상태에서 관리자 안내와 Google 로그인을 제공한다', () => {
    render(
      <AdminAccessBanner
        access={{ configured: true, authenticated: false, authorized: false, email: null }}
      />,
    );
    expect(screen.getByRole('heading', { name: '관리자 페이지에요' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Google 계정으로 계속하기' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
  });

  it('권한 없는 계정에서 관리 본문 대신 계정 전환과 로그아웃을 제공한다', () => {
    render(
      <AdminAccessBanner
        access={{
          configured: true,
          authenticated: true,
          authorized: false,
          email: 'guest@example.test',
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: '권한이 없어요' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Google 계정으로 계속하기' })).toBeVisible();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });

  it('작성자 상태를 한 번만 compact하게 표시한다', () => {
    render(
      <AdminAccessBanner
        access={{
          configured: true,
          authenticated: true,
          authorized: true,
          email: 'owner@example.test',
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: '관리자 페이지에요' })).toBeVisible();
    expect(screen.getByText(/owner@example.test/)).toBeVisible();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Google 계정으로 계속하기' }),
    ).not.toBeInTheDocument();
  });
});
