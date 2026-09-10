import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requireOwner: vi.fn(), createClient: vi.fn() }));
vi.mock('@lib/auth/owner', () => ({ requireOwner: mocks.requireOwner }));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.createClient }));

import { listAdminPosts } from '@features/admin/services/posts.admin';

describe('listAdminPosts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('authorizes before reading and omits full article bodies from the list query', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn().mockReturnValue({ order });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ select }) });

    await expect(listAdminPosts()).resolves.toEqual([]);
    expect(mocks.requireOwner).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledWith('id,title,slug,status,updated_at,pin_order');
  });

  it('does not create a database client when authorization fails', async () => {
    mocks.requireOwner.mockRejectedValue(new Error('forbidden'));

    await expect(listAdminPosts()).rejects.toThrow('forbidden');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
