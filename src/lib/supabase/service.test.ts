import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServiceClient } from '@lib/supabase/service';

describe('createServiceClient', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rewrites Supabase REST paths for the direct PostgREST origin', async () => {
    vi.stubEnv('SITE_URL', 'https://dev.raven.kr');
    vi.stubEnv('SUPABASE_INTERNAL_URL', 'http://raven-supabase-dev-rest:3000');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-test-key');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await createServiceClient().from('posts').select('id').limit(1);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/posts' }),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('fails closed without the exact Raven dev internal origin', () => {
    vi.stubEnv('SITE_URL', 'https://dev.raven.kr');
    vi.stubEnv('SUPABASE_INTERNAL_URL', 'https://supabase-dev.raven.kr');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-test-key');
    expect(() => createServiceClient()).toThrow('endpoint is not allowed');
  });

  it('uses the configured HTTPS Supabase project in production', async () => {
    vi.stubEnv('SITE_URL', 'https://raven.kr');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-test-key');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await createServiceClient().from('posts').select('id').limit(1);

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      'https://project.supabase.co/rest/v1/posts',
    );
  });
});
