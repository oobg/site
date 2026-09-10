import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@features/admin/components/AdminFrame', () => ({
  AdminFrame: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock('@features/admin/components/GoogleLoginButton', () => ({
  GoogleLoginButton: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button onClick={onSuccess}>Google 로그인</button>
  ),
}));

import AdminError from '@/app/admin/error';

describe('AdminError', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));

  it('조회 오류를 유지하면서 재시도와 페이지 내 Google 로그인을 함께 제공한다', () => {
    const reset = vi.fn();
    render(
      <AdminError
        error={Object.assign(new Error('private'), { digest: 'digest' })}
        reset={reset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Google 계정으로 다시 연결' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Google 로그인' })).toBeVisible();
    expect(screen.getByText(/세션이 만료됐거나/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Google 로그인' }));
    expect(reset).toHaveBeenCalledTimes(2);
  });
});
