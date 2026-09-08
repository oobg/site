import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ updateSession: vi.fn() }));

vi.mock('@lib/supabase/proxy', () => ({ updateSession: mocks.updateSession }));

import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateSession.mockResolvedValue(NextResponse.next());
  });

  it.each(['/blog/%25', '/projects/%25', '/blog/post%ZZ'])(
    'malformed detail path %s is rejected before route decoding',
    (path) => {
      const response = proxy(new NextRequest(`https://raven.kr${path}`));
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(400);
      expect(mocks.updateSession).not.toHaveBeenCalled();
    },
  );

  it('lets a valid encoded Korean detail path through without refreshing a session', () => {
    const response = proxy(new NextRequest('https://raven.kr/blog/%EA%B3%B5%EA%B0%9C-%EA%B8%80'));
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(200);
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it.each(['/blog', '/projects'])(
    'lets the public list %s through without refreshing a session',
    (path) => {
      const response = proxy(new NextRequest(`https://raven.kr${path}`));
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(200);
      expect(mocks.updateSession).not.toHaveBeenCalled();
    },
  );

  it('keeps authentication routes on the session refresh path', async () => {
    const request = new NextRequest('https://raven.kr/admin');
    await proxy(request);
    expect(mocks.updateSession).toHaveBeenCalledWith(request);
  });
});
