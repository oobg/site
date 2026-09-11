import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleLoginButton } from '@features/admin/components/GoogleLoginButton';

const {
  refresh,
  signInWithIdToken,
  initialize,
  renderButton,
  loadGoogleIdentityScript,
  generateGoogleNonce,
  router,
} = vi.hoisted(() => ({
  refresh: vi.fn(),
  signInWithIdToken: vi.fn(),
  initialize: vi.fn(),
  renderButton: vi.fn(),
  loadGoogleIdentityScript: vi.fn(),
  generateGoogleNonce: vi.fn(),
  router: { refresh: vi.fn() },
}));

router.refresh = refresh;
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@lib/supabase/browser', () => ({
  createClient: () => ({ auth: { signInWithIdToken } }),
}));
vi.mock('@lib/google/identity', () => ({
  getGoogleClientId: () => 'google-client-id',
  loadGoogleIdentityScript,
  generateGoogleNonce,
  getGoogleAccountsId: () => ({ initialize, renderButton }),
}));

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadGoogleIdentityScript.mockResolvedValue(undefined);
    generateGoogleNonce.mockResolvedValue({ nonce: 'raw-nonce', hashedNonce: 'hashed-nonce' });
    signInWithIdToken.mockResolvedValue({ error: null });
  });

  it('Google에는 hashed nonce를 설정하고 Supabase에는 credential과 raw nonce를 전달한다', async () => {
    const onSuccess = vi.fn();
    render(<GoogleLoginButton onSuccess={onSuccess} />);

    await waitFor(() => expect(initialize).toHaveBeenCalledOnce());
    const config = initialize.mock.calls[0]?.[0];
    expect(config).toMatchObject({
      client_id: 'google-client-id',
      nonce: 'hashed-nonce',
      auto_select: false,
      button_auto_select: false,
    });
    expect(renderButton).toHaveBeenCalledOnce();

    await act(async () => {
      await config.callback({ credential: 'google-id-token' });
    });

    expect(signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-id-token',
      nonce: 'raw-nonce',
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('하나의 Google callback credential을 한 번만 사용한다', async () => {
    render(<GoogleLoginButton />);
    await waitFor(() => expect(initialize).toHaveBeenCalledOnce());
    const callback = initialize.mock.calls[0]?.[0].callback;

    await act(async () => {
      await Promise.all([
        callback({ credential: 'same-token' }),
        callback({ credential: 'same-token' }),
      ]);
    });

    expect(signInWithIdToken).toHaveBeenCalledOnce();
  });

  it('스크립트가 차단되면 오류와 접근 가능한 재시도 동작을 제공한다', async () => {
    const onSuccess = vi.fn();
    loadGoogleIdentityScript.mockRejectedValueOnce(new Error('blocked'));
    render(<GoogleLoginButton onSuccess={onSuccess} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Google 로그인을 불러오지 못했습니다.',
    );
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(loadGoogleIdentityScript).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(renderButton).toHaveBeenCalledOnce());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
