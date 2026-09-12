import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';

const mocks = vi.hoisted(() => ({
  owner: vi.fn(),
  remote: vi.fn(),
  session: vi.fn(),
  service: vi.fn(),
}));
vi.mock('jose', async (original) => ({
  ...(await original<typeof import('jose')>()),
  createRemoteJWKSet: mocks.remote,
}));
vi.mock('@lib/auth/owner', async (original) => ({
  ...(await original<typeof import('@lib/auth/owner')>()),
  requireOwner: mocks.owner,
}));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.session }));
vi.mock('@lib/supabase/service', () => ({ createServiceClient: mocks.service }));

import { createAdminApiClient, requireAdminApiAccess } from '@lib/auth/admin-api';
import { getCloudflareAccessConfig, verifyCloudflareAccess } from '@lib/auth/cloudflare-access';
import { OwnerAuthorizationError } from '@lib/auth/owner';

const issuer = 'https://raven-test.cloudflareaccess.com';
const audience = 'test-app-audience';
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let wrongKeys: Awaited<ReturnType<typeof generateKeyPair>>;

async function token(overrides: Record<string, unknown> = {}, wrongSignature = false) {
  return new SignJWT({
    iss: issuer,
    aud: [audience],
    exp: Math.floor(Date.now() / 1000) + 600,
    sub: 'automation',
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .sign((wrongSignature ? wrongKeys : keys).privateKey);
}
function request(jwt?: string, origin: string | null = null, extra: Record<string, string> = {}) {
  return new Request('https://dev.raven.kr/api/admin/posts', {
    headers: {
      ...extra,
      ...(origin !== null ? { origin } : {}),
      ...(jwt ? { 'cf-access-jwt-assertion': jwt } : {}),
    },
  });
}
const verify = (jwt: string) => verifyCloudflareAccess(jwt, getCloudflareAccessConfig()!);

beforeAll(async () => {
  keys = await generateKeyPair('RS256');
  wrongKeys = await generateKeyPair('RS256');
  mocks.remote.mockReturnValue(
    createLocalJWKSet({
      keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'RS256' }],
    }),
  );
});
beforeEach(() => {
  vi.stubEnv('SITE_URL', 'https://dev.raven.kr');
  vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', issuer);
  vi.stubEnv('CLOUDFLARE_ACCESS_AUDIENCE', audience);
  mocks.owner
    .mockReset()
    .mockRejectedValue(new OwnerAuthorizationError('로그인이 필요합니다.', 401));
  mocks.session.mockReset().mockResolvedValue({ mode: 'session' });
  mocks.service.mockReset().mockReturnValue({ mode: 'service' });
});
afterEach(() => vi.unstubAllEnvs());

describe('verified Access and owner API authorization', () => {
  it('accepts a signed JWT without email or Origin and uses the fixed remote certs URL', async () => {
    const access = await requireAdminApiAccess(request(await token()));
    expect(access).toEqual({ mode: 'access', actor: 'automation' });
    expect(mocks.remote).toHaveBeenCalledWith(new URL(`${issuer}/cdn-cgi/access/certs`));
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(await createAdminApiClient(access)).toEqual({ mode: 'service' });
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it('keeps same-origin owner requests on the session client even behind Access', async () => {
    mocks.owner.mockResolvedValue({ email: 'owner@example.com' });
    const access = await requireAdminApiAccess(request(await token(), 'https://dev.raven.kr'));
    expect(access.mode).toBe('owner');
    await createAdminApiClient(access);
    expect(mocks.session).toHaveBeenCalledOnce();
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it('preserves owner authorization failures', async () => {
    mocks.owner.mockRejectedValue(new OwnerAuthorizationError('권한이 없습니다.', 403));
    await expect(
      requireAdminApiAccess(request(undefined, 'https://dev.raven.kr')),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('allows valid Access after owner failure', async () => {
    expect(
      await requireAdminApiAccess(request(await token(), 'https://dev.raven.kr')),
    ).toMatchObject({ mode: 'access' });
  });
  it.each([
    ['issuer', { iss: 'https://other.cloudflareaccess.com' }],
    ['audience', { aud: 'other-app' }],
    ['expiration', { exp: 1 }],
    ['missing expiration', { exp: undefined }],
    ['future nbf', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
  ])('rejects invalid %s', async (_name, overrides) => {
    await expect(verify(await token(overrides))).rejects.toMatchObject({ status: 401 });
  });
  it('rejects a different signing key and malformed JWT', async () => {
    await expect(verify(await token({}, true))).rejects.toMatchObject({ status: 401 });
    await expect(verify('forged')).rejects.toMatchObject({ status: 401 });
  });
  it('rejects mismatched Origin before either auth path, including valid JWT', async () => {
    await expect(
      requireAdminApiAccess(request(await token(), 'https://evil.example')),
    ).rejects.toMatchObject({ status: 403 });
    expect(mocks.owner).not.toHaveBeenCalled();
  });
  it('rejects absent Origin for cookies and forged email/client headers', async () => {
    mocks.owner.mockResolvedValue({ email: 'owner@example.com' });
    await expect(
      requireAdminApiAccess(
        request(undefined, null, {
          cookie: 'session=fake',
          'cf-access-authenticated-user-email': 'owner@example.com',
          'cf-access-client-id': 'fake',
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(mocks.owner).not.toHaveBeenCalled();
  });
  it('disables Access when both settings are missing while retaining owners', async () => {
    vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', '');
    vi.stubEnv('CLOUDFLARE_ACCESS_AUDIENCE', '');
    expect(getCloudflareAccessConfig()).toBeNull();
    await expect(requireAdminApiAccess(request(await token()))).rejects.toMatchObject({
      status: 403,
    });
    mocks.owner.mockResolvedValue({ email: 'owner@example.com' });
    expect(await requireAdminApiAccess(request(undefined, 'https://dev.raven.kr'))).toMatchObject({
      mode: 'owner',
    });
  });
  it.each(['CLOUDFLARE_ACCESS_TEAM_DOMAIN', 'CLOUDFLARE_ACCESS_AUDIENCE'])(
    'fails closed with partial config %s',
    async (name) => {
      vi.stubEnv(name, '');
      mocks.owner.mockResolvedValue({ email: 'owner@example.com' });
      await expect(
        requireAdminApiAccess(request(undefined, 'https://dev.raven.kr')),
      ).rejects.toThrow('불완전');
      expect(mocks.owner).not.toHaveBeenCalled();
    },
  );
  it.each([
    'http://team.example',
    'https://team.example/path',
    'https://user:pass@team.example',
    'https://team.example?query=1',
    'https://team.example/#hash',
  ])('rejects non-origin configuration %s', (team) => {
    vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', team);
    expect(getCloudflareAccessConfig).toThrow();
  });
  it('requires SITE_URL and sanitizes service client configuration failure', async () => {
    vi.stubEnv('SITE_URL', '');
    await expect(requireAdminApiAccess(request())).rejects.toThrow('SITE_URL');
    mocks.service.mockImplementation(() => {
      throw new Error('secret endpoint');
    });
    await expect(createAdminApiClient({ mode: 'access', actor: 'test' })).rejects.toThrow(
      '관리자 데이터베이스',
    );
  });
});
