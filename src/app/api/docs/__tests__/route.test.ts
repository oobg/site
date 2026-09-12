import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';

const mocks = vi.hoisted(() => ({
  remote: vi.fn(),
  keyLookup: vi.fn(),
  owner: vi.fn(),
  ownerAccess: vi.fn(),
  session: vi.fn(),
  fetch: vi.fn(),
}));

// Keep signature/claim verification real, but resolve every key locally.
vi.mock('jose', async (original) => ({
  ...(await original<typeof import('jose')>()),
  createRemoteJWKSet: mocks.remote,
}));
vi.mock('@lib/auth/owner', async (original) => ({
  ...(await original<typeof import('@lib/auth/owner')>()),
  requireOwner: mocks.owner,
  getOwnerAccess: mocks.ownerAccess,
}));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.session }));

import { GET } from '@/app/api/docs/route';
import { renderApiDocsPage } from '@/app/api/docs/docs-page';
import { apiSpecification } from '@lib/api/openapi';

const DOCS_EMAIL = 'yoonseok.bae98@gmail.com';
const PROD_URL = 'https://raven.kr';
const issuer = 'https://docs-test.cloudflareaccess.com';
const adminAudience = 'admin-test-audience';
const docsAudience = 'docs-test-audience';
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let wrongKeys: Awaited<ReturnType<typeof generateKeyPair>>;
let localKeys: ReturnType<typeof createLocalJWKSet>;

async function token(overrides: Record<string, unknown> = {}, wrongSignature = false) {
  return new SignJWT({
    iss: issuer,
    aud: [docsAudience],
    exp: Math.floor(Date.now() / 1000) + 600,
    sub: 'docs-owner',
    email: DOCS_EMAIL,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'docs-test-key' })
    .sign((wrongSignature ? wrongKeys : keys).privateKey);
}

function request(jwt?: string, options: { accept?: string; url?: string } = {}) {
  return new Request(options.url ?? `${PROD_URL}/api/docs`, {
    headers: {
      // Even a same-origin Google session or an asserted email cannot replace JWT auth.
      origin: PROD_URL,
      cookie: 'session=fake',
      'cf-access-authenticated-user-email': DOCS_EMAIL,
      ...(options.accept === undefined ? {} : { accept: options.accept }),
      ...(jwt === undefined ? {} : { 'cf-access-jwt-assertion': jwt }),
    },
  });
}

function expectHeaders(response: Response) {
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('vary')).toBe('Cf-Access-Jwt-Assertion, Accept');
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  expect(response.headers.get('content-type')).toContain('application/json');
}

async function expectDenied(response: Response, status = 403) {
  expect(response.status).toBe(status);
  expectHeaders(response);
  expect(await response.json()).toEqual({
    error: { code: 'DOCS_FORBIDDEN', message: 'API 문서 접근 권한이 없습니다.' },
  });
}

beforeAll(async () => {
  [keys, wrongKeys] = await Promise.all([generateKeyPair('RS256'), generateKeyPair('RS256')]);
  localKeys = createLocalJWKSet({
    keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'docs-test-key', alg: 'RS256' }],
  });
  mocks.remote.mockReturnValue(mocks.keyLookup);
});

beforeEach(() => {
  vi.stubEnv('SITE_URL', PROD_URL);
  vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', issuer);
  vi.stubEnv('CLOUDFLARE_ACCESS_AUDIENCE', adminAudience);
  vi.stubEnv('CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE', docsAudience);
  mocks.keyLookup.mockReset().mockImplementation(localKeys);
  const owner = { configured: true, authenticated: true, authorized: true, email: DOCS_EMAIL };
  mocks.owner.mockReset().mockResolvedValue(owner);
  mocks.ownerAccess.mockReset().mockResolvedValue(owner);
  mocks.session.mockReset().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            email: DOCS_EMAIL,
            email_confirmed_at: '2026-01-01',
            app_metadata: { provider: 'google' },
          },
        },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  });
  mocks.fetch.mockReset().mockRejectedValue(new Error('Unexpected network request'));
  vi.stubGlobal('fetch', mocks.fetch);
});

afterEach(() => {
  try {
    // Every success and denial must bypass Google owner/session authorization.
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(mocks.ownerAccess).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});

describe('GET /api/docs production-only Access authorization', () => {
  it.each([
    'https://dev.raven.kr',
    'http://localhost:3000',
    'https://preview.raven.kr',
    'https://raven.kr.example.com',
    'http://raven.kr',
    '',
    undefined,
  ])('denies non-production SITE_URL %s even with an authorized JWT', async (siteUrl) => {
    vi.stubEnv('SITE_URL', siteUrl);
    await expectDenied(await GET(request(await token())));
    expect(mocks.keyLookup).not.toHaveBeenCalled();
  });

  it.each([
    ['', ''],
    [issuer, undefined],
    [issuer, ''],
    [undefined, docsAudience],
    ['', docsAudience],
    ['   ', docsAudience],
    [issuer, '   '],
  ])('denies missing or incomplete Access configuration (%s, %s)', async (team, aud) => {
    vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', team);
    vi.stubEnv('CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE', aud);
    await expectDenied(await GET(request(await token())));
    expect(mocks.keyLookup).not.toHaveBeenCalled();
  });

  it.each(['http://team.example', 'https://team.example/path', 'not-a-url'])(
    'denies invalid Access team domain %s',
    async (team) => {
      vi.stubEnv('CLOUDFLARE_ACCESS_TEAM_DOMAIN', team);
      await expectDenied(await GET(request(await token())));
      expect(mocks.keyLookup).not.toHaveBeenCalled();
    },
  );

  it('does not use the admin audience when docs configuration is missing', async () => {
    vi.stubEnv('CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE', undefined);
    await expectDenied(await GET(request(await token())));
    expect(mocks.keyLookup).not.toHaveBeenCalled();
  });

  it('rejects a valid admin-audience JWT even with the exact docs email', async () => {
    const adminToken = new SignJWT({
      iss: issuer,
      aud: [adminAudience],
      exp: Math.floor(Date.now() / 1000) + 600,
      sub: 'admin-owner',
      email: DOCS_EMAIL,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'docs-test-key' })
      .sign(keys.privateKey);
    await expectDenied(await GET(request(await adminToken)), 401);
  });

  it('accepts the docs audience independently when the admin audience is missing', async () => {
    vi.stubEnv('CLOUDFLARE_ACCESS_AUDIENCE', undefined);
    const response = await GET(request(await token()));
    expect(response.status).toBe(200);
    expectHeaders(response);
  });

  it('accepts the docs audience independently when the admin audience changes', async () => {
    vi.stubEnv('CLOUDFLARE_ACCESS_AUDIENCE', 'different-admin-audience');
    const response = await GET(request(await token()));
    expect(response.status).toBe(200);
    expectHeaders(response);
  });

  it.each([undefined, ''])('returns 401 for a missing or empty assertion (%s)', async (jwt) => {
    await expectDenied(await GET(request(jwt)), 401);
    expect(mocks.keyLookup).not.toHaveBeenCalled();
  });

  it.each(['forged', 'x'.repeat(32_769)])(
    'returns 401 for a malformed or oversized assertion',
    async (jwt) => {
      await expectDenied(await GET(request(jwt)), 401);
    },
  );

  it('returns 401 for a forged signature even with the exact authorized email', async () => {
    await expectDenied(await GET(request(await token({}, true))), 401);
  });

  it.each([
    ['issuer', { iss: 'https://other.cloudflareaccess.com' }],
    ['audience', { aud: 'other-app' }],
    ['expiration', { exp: 1 }],
    ['missing expiration', { exp: undefined }],
    ['future not-before', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
  ])('returns 401 for invalid %s', async (_name, overrides) => {
    await expectDenied(await GET(request(await token(overrides))), 401);
  });

  it('fails closed when key resolution fails unexpectedly', async () => {
    mocks.keyLookup.mockRejectedValueOnce(new Error('private key service details'));
    await expectDenied(await GET(request(await token())));
  });

  it.each([
    'other@example.com',
    'yoonseok.bae98+docs@gmail.com',
    `${DOCS_EMAIL}.example.com`,
    ` ${DOCS_EMAIL} `,
    undefined,
    '',
    null,
    42,
  ])('returns 403 for a signed JWT with an unauthorized or missing email (%s)', async (email) => {
    await expectDenied(await GET(request(await token({ email }))));
  });

  it.each([DOCS_EMAIL, DOCS_EMAIL.toUpperCase()])(
    'returns OpenAPI JSON for the exact authorized email case-insensitively (%s)',
    async (email) => {
      const response = await GET(request(await token({ email })));
      expect(response.status).toBe(200);
      expectHeaders(response);
      const body = await response.json();
      expect(body).toEqual(apiSpecification);
      expect(body.openapi).toBe('3.1.0');
      expect(body.info).toBeDefined();
      expect(body.paths).toBeDefined();
      expect(mocks.remote).toHaveBeenCalledWith(new URL(`${issuer}/cdn-cgi/access/certs`));
    },
  );

  it('renders accessible HTML documentation for an authorized browser request', async () => {
    const response = await GET(
      request(await token(), {
        accept: 'text/html,application/xhtml+xml,application/json;q=0.8',
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toBe('Cf-Access-Jwt-Assertion, Accept');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    const html = await response.text();
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain('<h1>Raven HTTP API</h1>');
    expect(html).toContain('v2.0.0');
    expect(html).toContain('href="/api/docs?format=json"');
    expect(html).toContain('Endpoint groups');
    expect(html).toContain('CloudflareAccessJwt');
    expect(html).toContain('/api/admin/posts');
    expect(html).toContain('Parameters');
    expect(html).toContain('Request body');
    expect(html).toContain('Responses');
  });

  it.each(['json', 'raw'])('keeps the OpenAPI JSON available through format=%s', async (format) => {
    const response = await GET(
      request(await token(), {
        accept: 'text/html',
        url: `${PROD_URL}/api/docs?format=${format}`,
      }),
    );

    expectHeaders(response);
    expect(await response.json()).toEqual(apiSpecification);
  });

  it('returns JSON when HTML is explicitly unacceptable', async () => {
    const response = await GET(
      request(await token(), { accept: 'text/html;q=0,application/json' }),
    );
    expectHeaders(response);
    expect(await response.json()).toEqual(apiSpecification);
  });

  it('checks Access before negotiating an HTML response', async () => {
    await expectDenied(await GET(request(undefined, { accept: 'text/html' })), 401);
  });

  it('normalizes surrounding whitespace and a trailing slash in the production SITE_URL', async () => {
    vi.stubEnv('SITE_URL', ` ${PROD_URL}/ `);
    const response = await GET(request(await token()));
    expect(response.status).toBe(200);
    expectHeaders(response);
    expect(await response.json()).toEqual(apiSpecification);
  });
});

describe('API docs HTML rendering', () => {
  it('escapes every spec-derived label and description', () => {
    const html = renderApiDocsPage({
      openapi: '3.1.0',
      info: {
        title: '<script>alert("title")</script>',
        version: '1<2',
        description: '<img src=x onerror=alert(1)>',
      },
      paths: {
        '/api/<unsafe>': {
          get: {
            tags: ['<Public>'],
            summary: '<script>alert("summary")</script>',
            parameters: [{ name: '<name>', in: 'query', description: '<b>description</b>' }],
            responses: { 200: { description: '<strong>ok</strong>' } },
          },
        },
      },
    });

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>description</b>');
    expect(html).toContain('&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt;');
    expect(html).toContain('/api/&lt;unsafe&gt;');
    expect(html).toContain('&lt;strong&gt;ok&lt;/strong&gt;');
  });
});
