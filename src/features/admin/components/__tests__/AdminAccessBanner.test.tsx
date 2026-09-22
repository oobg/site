import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_BANNER_DISMISSED_KEY,
  AdminAccessBanner,
} from '@features/admin/components/AdminAccessBanner';

vi.mock('@features/admin/components/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <button>Google 계정으로 계속하기</button>,
}));

describe('AdminAccessBanner', () => {
  beforeEach(() => sessionStorage.clear());

  it('비로그인 상태에서 관리자 안내와 Google 로그인을 제공한다', () => {
    render(
      <AdminAccessBanner
        access={{ configured: true, authenticated: false, authorized: false, email: null }}
      />,
    );
    expect(screen.getByRole('heading', { name: '관리자 페이지에요' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Google 계정으로 계속하기' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '관리자 안내 닫기' })).not.toBeInTheDocument();
  });

  it('권한 없는 계정에서 닫을 수 없는 계정 전환 경로를 제공한다', () => {
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
    expect(screen.queryByRole('button', { name: '관리자 안내 닫기' })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '관리자 안내 닫기' }));
    expect(screen.queryByRole('heading', { name: '관리자 페이지에요' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_BANNER_DISMISSED_KEY)).toBe('1');
    expect(
      screen.queryByRole('button', { name: 'Google 계정으로 계속하기' }),
    ).not.toBeInTheDocument();
  });

  it('server content로 hydrate한 뒤 같은 session에서 닫힘 상태를 복원한다', async () => {
    const access = {
      configured: true,
      authenticated: true,
      authorized: true,
      email: 'owner@example.test',
    };
    sessionStorage.setItem(ADMIN_BANNER_DISMISSED_KEY, '1');
    const container = document.createElement('div');
    container.innerHTML = renderToString(<AdminAccessBanner access={access} />);
    document.body.appendChild(container);

    expect(container).toHaveTextContent('owner@example.test');
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <AdminAccessBanner access={access} />);
    });
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    await act(async () => root.unmount());
    container.remove();
  });
});
