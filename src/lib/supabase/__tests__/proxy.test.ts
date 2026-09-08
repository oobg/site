import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getSupabaseConfig: vi.fn(),
  getClaims: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.createServerClient }));
vi.mock('@configs/cms-env', () => ({ getSupabaseConfig: mocks.getSupabaseConfig }));

import { NextRequest } from 'next/server';
import { updateSession } from '@lib/supabase/proxy';

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseConfig.mockReturnValue({
      url: 'https://example.supabase.co',
      publishableKey: 'key',
    });
    mocks.createServerClient.mockReturnValue({ auth: { getClaims: mocks.getClaims } });
  });

  it('keeps the request available when session refresh fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getClaims.mockRejectedValue(new TypeError('network details'));

    const response = await updateSession(new NextRequest('https://raven.kr/admin'));

    expect(response.status).toBe(200);
    expect(log).toHaveBeenCalledWith('Session refresh failed', { kind: 'TypeError' });
    log.mockRestore();
  });
});
