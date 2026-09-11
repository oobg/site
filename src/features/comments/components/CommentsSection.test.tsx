import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommentsSection } from './CommentsSection';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CommentsSection', () => {
  it('uses the server-provided avatar CDN base', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, nextCursor: null }),
      }),
    );

    const { container } = render(
      <CommentsSection
        slug="avatar-cdn"
        avatarBaseUrl="https://cdn.example.com/assets/comment-avatars/"
      />,
    );

    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(
      /^https:\/\/cdn\.example\.com\/assets\/comment-avatars\/clay-\d{2}\.webp$/,
    );
  });
});

const parent = {
  id: 'parent',
  parent_id: null,
  is_author: false,
  nickname: '독자',
  avatar_id: 'clay-01',
  body: '원댓글',
  created_at: '2026-09-11T00:00:00Z',
};
const reply = {
  ...parent,
  id: 'reply',
  parent_id: parent.id,
  is_author: true,
  nickname: 'raven',
  body: '작성자 답글',
  avatar_id: 'clay-64',
};
const response = (data: object, ok = true) => ({ ok, json: async () => data });

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('public threads and identity interaction', () => {
  it('renders replies under their parent with a cue and author badge and excludes orphan replies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          items: [
            parent,
            reply,
            { ...reply, id: 'orphan', parent_id: 'missing', body: '누출 금지' },
          ],
          total: 1,
          nextCursor: null,
        }),
      ),
    );
    render(<CommentsSection slug="post" />);
    const replies = await screen.findByRole('list', { name: '독자님 댓글의 답글' });
    expect(within(replies).getByText('작성자 답글')).toBeInTheDocument();
    expect(within(replies).getByText('작성자')).toBeInTheDocument();
    expect(within(replies).getByText('ㄴ>')).toBeInTheDocument();
    expect(screen.queryByText('누출 금지')).toBeNull();
    expect(screen.getByRole('heading', { name: '댓글 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '답글' })).toBeNull();
  });
  it('retains threads after failed load-more and retries the same parent cursor', async () => {
    const older = { ...parent, id: 'older', nickname: '다른 독자', body: '이전 댓글' };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({ items: [parent, reply], total: 2, nextCursor: 'parent-cursor' }),
      )
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(
        response({
          items: [older, { ...reply, id: 'older-reply', parent_id: older.id, body: '이전 답글' }],
          total: 2,
          nextCursor: null,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(<CommentsSection slug="post" />);
    fireEvent.click(await screen.findByRole('button', { name: '댓글 더 보기' }));
    await screen.findByText('댓글을 더 불러오지 못했어요. 다시 시도해 주세요.');
    expect(screen.getByText('작성자 답글')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '댓글 더 보기' }));
    expect(await screen.findByText('이전 답글')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe(fetchMock.mock.calls[2][0]);
    expect(screen.getByRole('heading', { name: '댓글 2' })).toBeInTheDocument();
  });
  it('recovers an initial list failure and preserves normal comment creation', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response({ items: [], total: 0, nextCursor: null }))
      .mockResolvedValueOnce(response({ comment: parent }));
    vi.stubGlobal('fetch', fetchMock);
    render(<CommentsSection slug="post" />);
    fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
    await screen.findByText('첫 댓글을 남겨 보세요.');
    fireEvent.change(screen.getByLabelText('댓글 내용'), { target: { value: ' 원댓글 ' } });
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }));
    expect(await screen.findByText('원댓글')).toBeInTheDocument();
    const input = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(Object.keys(input).sort()).toEqual(['avatar_id', 'body', 'nickname']);
    expect(input.body).toBe('원댓글');
    expect(screen.getByRole('heading', { name: '댓글 1' })).toBeInTheDocument();
  });
  it('reveals the random nickname one character at a time and restarts on repeated clicks', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ items: [], total: 0, nextCursor: null })),
    );
    const { container } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();
    const button = screen.getByRole('button', { name: '랜덤 변경' });
    const input = screen.getByLabelText('닉네임');

    fireEvent.click(button);
    const avatar = container.querySelector('img[data-randomized="true"]');
    expect(avatar).not.toBeNull();
    const ripple = container.querySelector('label > span[aria-hidden="true"]');
    expect(ripple).not.toBeNull();

    expect(input).toHaveValue('');
    act(() => vi.advanceTimersByTime(40));
    expect((input as HTMLInputElement).value).toHaveLength(1);
    act(() => vi.advanceTimersByTime(40));
    expect((input as HTMLInputElement).value).toHaveLength(2);

    fireEvent.click(button);
    expect(container.querySelector('img[data-randomized="true"]')).not.toBe(avatar);
    expect(container.querySelector('label > span[aria-hidden="true"]')).not.toBe(ripple);
    expect(input).toHaveValue('');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('cancels nickname animation when the visitor types', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ items: [], total: 0, nextCursor: null })),
    );
    render(<CommentsSection slug="post" />);
    await flushMicrotasks();
    const button = screen.getByRole('button', { name: '랜덤 변경' });
    const input = screen.getByLabelText('닉네임');

    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(40));
    fireEvent.change(input, { target: { value: '직접 입력한 이름' } });
    act(() => vi.advanceTimersByTime(1000));

    expect(input).toHaveValue('직접 입력한 이름');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('switches immediately without a JavaScript timer when reduced motion is preferred', async () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          media: query,
          matches: query === '(prefers-reduced-motion: reduce)',
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ items: [], total: 0, nextCursor: null })),
    );
    const { unmount } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();
    const input = screen.getByLabelText('닉네임');

    fireEvent.click(screen.getByRole('button', { name: '랜덤 변경' }));

    expect(input).not.toHaveValue('');
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it('cleans the active nickname timer when unmounted', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ items: [], total: 0, nextCursor: null })),
    );
    const { unmount } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    fireEvent.click(screen.getByRole('button', { name: '랜덤 변경' }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
