import { describe, expect, it, vi } from 'vitest';

vi.mock('@lib/auth/owner', () => ({ getOwnerAccess: vi.fn() }));
vi.mock('@features/admin/services/posts.admin', () => ({ listAdminPosts: vi.fn() }));

import { getAuthMessage } from '@/app/admin/page';

describe('admin auth message', () => {
  it('only resolves explicitly configured own keys', () => {
    expect(getAuthMessage('oauth')).toContain('Google');
    expect(getAuthMessage('__proto__')).toBeUndefined();
    expect(getAuthMessage('constructor')).toBeUndefined();
    expect(getAuthMessage('toString')).toBeUndefined();
  });
});
