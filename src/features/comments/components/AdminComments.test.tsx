import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminComments } from './AdminComments';
const parent = {
  id: '00000000-0000-4000-8000-000000000001',
  parent_id: null,
  is_author: false,
  nickname: '독자',
  avatar_id: 'clay-01',
  body: '원댓글',
  created_at: '2026-09-11T00:00:00Z',
  post_slug: 'post',
  moderation_status: 'visible',
};
const reply = {
  ...parent,
  id: '00000000-0000-4000-8000-000000000002',
  parent_id: parent.id,
  is_author: true,
  nickname: 'raven',
  body: '답글 내용',
  avatar_id: 'clay-64',
  created_at: '2026-09-11T01:00:00Z',
};
const response = (data: object, ok = true) => ({ ok, json: async () => data });
afterEach(() => vi.unstubAllGlobals());

describe('AdminComments reply flow', () => {
  it('shows hierarchy, author badge, and reply buttons only on parents', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ items: [reply, parent] })));
    render(<AdminComments />);
    const root = await screen.findByRole('listitem', { name: '독자 댓글' });
    const child = screen.getByRole('listitem', { name: 'raven 답글' });
    expect(screen.getAllByRole('listitem')).toEqual([root, child]);
    expect(child).toHaveAttribute('data-reply', 'true');
    expect(within(child).getByText('작성자')).toBeInTheDocument();
    expect(within(child).queryByRole('button', { name: '답글' })).toBeNull();
    expect(within(root).getByRole('button', { name: '답글' })).toBeInTheDocument();
  });
  it('submits only trimmed body and parent, disables while pending, and immediately includes the reply', async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ items: [parent] }))
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminComments />);
    fireEvent.click(await screen.findByRole('button', { name: '답글' }));
    const input = screen.getByLabelText('독자님에게 답글');
    expect(screen.getByRole('button', { name: '답글 등록' })).toBeDisabled();
    fireEvent.change(input, { target: { value: ' 답글 내용 ' } });
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: '등록 중…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      parent_id: parent.id,
      body: '답글 내용',
    });
    await act(async () => resolve(response({ comment: reply })));
    expect(await screen.findByText('답글 내용')).toBeInTheDocument();
    expect(screen.queryByLabelText('독자님에게 답글')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('cancels without saving and preserves the draft for retry after server failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ items: [parent] }))
      .mockResolvedValueOnce(response({ error: { message: '등록 실패' } }, false))
      .mockResolvedValueOnce(response({ comment: reply }));
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminComments />);
    fireEvent.click(await screen.findByRole('button', { name: '답글' }));
    fireEvent.change(screen.getByLabelText('독자님에게 답글'), {
      target: { value: '취소할 내용' },
    });
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '답글' }));
    expect(screen.getByLabelText('독자님에게 답글')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('독자님에게 답글'), { target: { value: '답글 내용' } });
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('등록 실패');
    expect(screen.getByLabelText('독자님에게 답글')).toHaveValue('답글 내용');
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(screen.getByText('답글 내용')).toBeInTheDocument();
  });
  it('removes replies from the UI when their parent is deleted', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ items: [parent, reply] }))
        .mockResolvedValueOnce({ ok: true }),
    );
    render(<AdminComments />);
    fireEvent.click(await screen.findByRole('button', { name: '독자 댓글 삭제' }));
    await waitFor(() => expect(screen.queryByText('답글 내용')).toBeNull());
    expect(screen.getByText('아직 댓글이 없어요.')).toBeInTheDocument();
  });
});
