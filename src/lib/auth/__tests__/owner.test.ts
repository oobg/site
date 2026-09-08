import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getOwnerEmails: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@configs/cms-env', () => ({
  CmsConfigurationError: class CmsConfigurationError extends Error {},
  getOwnerEmails: mocks.getOwnerEmails,
}));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.createClient }));

import { getOwnerAccess, requireOwner } from '@lib/auth/owner';
import { CmsConfigurationError } from '@configs/cms-env';

const userClient = (user: unknown, error: unknown = null, rpc = vi.fn()) => ({
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error }) },
  rpc,
});

describe('owner authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOwnerEmails.mockReturnValue(new Set(['owner@example.com']));
  });

  it('requires both a verified Google identity and the database owner policy', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: ' Owner@Example.com ',
              email_confirmed_at: '2026-09-08T00:00:00Z',
              app_metadata: { provider: 'google' },
            },
          },
          error: null,
        }),
      },
      rpc,
    });

    await expect(requireOwner()).resolves.toMatchObject({ authorized: true });
    expect(rpc).toHaveBeenCalledWith('is_cms_owner');
  });

  it('fails closed when the authentication service throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createClient.mockRejectedValue(new Error('upstream unavailable'));

    await expect(getOwnerAccess()).resolves.toEqual({
      configured: true,
      authenticated: false,
      authorized: false,
      email: null,
    });
    await expect(requireOwner()).rejects.toMatchObject({ status: 401 });
    expect(log).toHaveBeenCalledWith('Owner access check failed', { kind: 'Error' });
    log.mockRestore();
  });

  it('reports an empty owner allowlist as unconfigured and requireOwner as 503', async () => {
    mocks.getOwnerEmails.mockReturnValue(new Set());
    await expect(getOwnerAccess()).resolves.toMatchObject({ configured: false });
    await expect(requireOwner()).rejects.toMatchObject({ status: 503 });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('maps CMS configuration failures to 503', async () => {
    mocks.createClient.mockRejectedValue(new CmsConfigurationError('missing'));
    await expect(requireOwner()).rejects.toMatchObject({ status: 503 });
  });

  it.each([
    ['getUser error', null, new Error('auth')],
    ['null user', null, null],
    [
      'unverified email',
      { email: 'owner@example.com', app_metadata: { provider: 'google' } },
      null,
    ],
    [
      'non-Google identity',
      {
        email: 'owner@example.com',
        email_confirmed_at: 'now',
        app_metadata: { provider: 'email' },
      },
      null,
    ],
  ])('rejects %s as unauthenticated', async (_label, user, error) => {
    mocks.createClient.mockResolvedValue(userClient(user, error));
    await expect(requireOwner()).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a verified Google email outside the allowlist without an RPC call', async () => {
    const rpc = vi.fn();
    mocks.createClient.mockResolvedValue(
      userClient(
        {
          email: 'other@example.com',
          email_confirmed_at: 'now',
          app_metadata: { provider: 'google' },
        },
        null,
        rpc,
      ),
    );
    await expect(requireOwner()).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ['false result', { data: false, error: null }],
    ['RPC error', { data: null, error: new Error('policy') }],
  ])('rejects an allowlisted Google user when owner RPC returns %s', async (_label, result) => {
    const rpc = vi.fn().mockResolvedValue(result);
    mocks.createClient.mockResolvedValue(
      userClient(
        {
          email: 'owner@example.com',
          email_confirmed_at: 'now',
          app_metadata: { provider: 'google' },
        },
        null,
        rpc,
      ),
    );
    await expect(requireOwner()).rejects.toMatchObject({ status: 403 });
  });

  it('accepts Google in the providers array', async () => {
    mocks.createClient.mockResolvedValue(
      userClient(
        {
          email: 'owner@example.com',
          email_confirmed_at: 'now',
          app_metadata: { provider: 'email', providers: ['email', 'google'] },
        },
        null,
        vi.fn().mockResolvedValue({ data: true, error: null }),
      ),
    );
    await expect(requireOwner()).resolves.toMatchObject({ authorized: true });
  });

  it('fails closed when the owner RPC throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createClient.mockResolvedValue(
      userClient(
        {
          email: 'owner@example.com',
          email_confirmed_at: 'now',
          app_metadata: { provider: 'google' },
        },
        null,
        vi.fn().mockRejectedValue(new Error('rpc down')),
      ),
    );
    await expect(getOwnerAccess()).resolves.toMatchObject({ authorized: false });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
