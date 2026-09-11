import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@lib/auth/owner', () => ({
  requireOwner: mocks.requireOwner,
  OwnerAuthorizationError: class extends Error {},
}));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
import { updatePostStatusAction } from '@features/admin/services/posts.actions';

const id = '8e10a748-fd28-41a0-9f3d-8b81fc40c753';
function database(current: Record<string, unknown>, updateError: unknown = null) {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: updateError }) });
  const single = vi.fn().mockResolvedValue({ data: current, error: null });
  const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) });
  mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ select, update }) });
  return update;
}

describe('updatePostStatusAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
  });
  it('rejects unknown statuses before writing', async () => {
    expect(await updatePostStatusAction(id, 'archived')).toMatchObject({ status: 'error' });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('requires owner access', async () => {
    mocks.requireOwner.mockRejectedValue(new Error('denied'));
    expect(await updatePostStatusAction(id, 'draft')).toMatchObject({ status: 'error' });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('preserves the first publish timestamp and updates only status fields', async () => {
    const update = database({
      title: '제목',
      slug: 'slug',
      description: '설명',
      body: '본문',
      status: 'draft',
      published_at: '2026-09-01T00:00:00Z',
    });
    expect((await updatePostStatusAction(id, 'published')).status).toBe('success');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published', published_at: '2026-09-01T00:00:00Z' }),
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty('body');
  });
  it('allows moving an incomplete legacy post back to draft', async () => {
    const update = database({
      title: '',
      slug: 'bad slug',
      description: '',
      body: '',
      status: 'published',
      published_at: '2026-09-01T00:00:00Z',
    });
    expect((await updatePostStatusAction(id, 'draft')).status).toBe('success');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft', published_at: null }),
    );
  });
});
