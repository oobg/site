import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mocks.invalidate.mockResolvedValue(undefined);
});

describe('DeletePostButton', () => {
  it('deletes despite invalid editor fields and failed cache refresh', async () => {
    mocks.remove.mockResolvedValue({ status: 'success', message: '삭제했습니다.' });
    mocks.invalidate.mockRejectedValue(new Error('cache unavailable'));
    render(
      <form>
        <input name="title" required defaultValue="" />
        <DeletePostButton id="p1" />
      </form>,
    );
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '글 삭제' });
    expect(button).toHaveAttribute('formnovalidate');
    expect(button.form?.checkValidity()).toBe(false);
    fireEvent.click(button);
    expect(window.confirm).toHaveBeenCalledTimes(1);
    // jsdom's requestSubmit checks only form.noValidate and ignores the
    // submitter's formNoValidate. Dispatch the browser's resulting submit event.
    fireEvent(
      button.form!,
      new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: button }),
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin'));
    expect(mocks.remove.mock.calls[0][1].get('id')).toBe('p1');
  });

  it('shows a recoverable error when the delete request rejects', async () => {
    mocks.remove.mockRejectedValue(new Error('offline'));
    render(
      <form>
        <DeletePostButton id="p1" />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: '글 삭제' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('글을 삭제하지 못했어요.');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does not submit when the deletion confirmation is cancelled', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(
      <form>
        <DeletePostButton id="p1" />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: '글 삭제' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
