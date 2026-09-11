import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), signOut: vi.fn(), redirect: vi.fn() }));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import { signOutAction } from '@features/admin/services/auth.actions';

describe('signOutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({ auth: { signOut: mocks.signOut } });
  });

  it('redirects only after Supabase confirms sign out', async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    await signOutAction();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin');
  });

  it('does not report success or leak upstream details when sign out fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.signOut.mockResolvedValue({
      error: { name: 'AuthRetryableFetchError', message: 'private' },
    });

    await expect(signOutAction()).rejects.toThrow('로그아웃하지 못했습니다.');
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Sign out failed', { kind: 'AuthRetryableFetchError' });
    log.mockRestore();
  });
});
