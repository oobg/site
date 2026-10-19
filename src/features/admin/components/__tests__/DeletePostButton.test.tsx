import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeletePostButton } from '@features/admin/components/DeletePostButton';

const mocks = vi.hoisted(() => ({ remove: vi.fn(), invalidate: vi.fn(), replace: vi.fn() }));
vi.mock('@features/admin/services/posts.actions', () => ({ deletePostAction: mocks.remove }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invalidate.mockResolvedValue(undefined);
});
const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '글 삭제' }));
  return screen.findByRole('dialog', { name: '글을 영구 삭제할까요?' });
};
describe('DeletePostButton', () => {
  it('names the target and deletes exactly once despite invalid editor fields and cache failure', async () => {
    mocks.remove.mockResolvedValue({ status: 'success', message: '삭제했습니다.' });
    mocks.invalidate.mockRejectedValue(new Error('cache unavailable'));
    render(
      <form>
        <input name="title" required defaultValue="" />
        <DeletePostButton id="p1" title="대상 글" />
      </form>,
    );
    const dialog = await open();
    expect(dialog).toHaveTextContent('대상 글');
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '영구 삭제' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin'));
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(mocks.remove.mock.calls[0][1].get('id')).toBe('p1');
  });
  it('keeps the dialog open for a retry after deletion fails', async () => {
    mocks.remove.mockRejectedValue(new Error('offline'));
    render(<DeletePostButton id="p1" />);
    const dialog = await open();
    fireEvent.click(within(dialog).getByRole('button', { name: '영구 삭제' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('글을 삭제하지 못했어요.');
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: '영구 삭제' })).toBeEnabled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it('cancel and Escape never delete and restore trigger focus', async () => {
    render(<DeletePostButton id="p1" />);
    const trigger = screen.getByRole('button', { name: '글 삭제' });
    const dialog = await open();
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(trigger);
    const reopened = await screen.findByRole('dialog');
    fireEvent.keyDown(reopened, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
