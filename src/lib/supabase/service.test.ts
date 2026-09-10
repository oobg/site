import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServiceClient } from '@lib/supabase/service';

describe('createServiceClient', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rewrites Supabase REST paths for the direct PostgREST origin', async () => {
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
    vi.stubEnv('SUPABASE_INTERNAL_URL', 'https://supabase-dev.raven.kr');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-test-key');
    expect(() => createServiceClient()).toThrow('endpoint is not allowed');
  });
});
