import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminComments } from './AdminComments';

const comments = [
  {
    id: 'c1',
    nickname: '민지',
    avatar_id: 'clay-01',
    body: '좋은 글 잘 읽었습니다.',
    created_at: '2026-09-18T09:30:00.000Z',
    post_slug: 'design-notes',
    moderation_status: 'visible' as const,
  },
  {
    id: 'c2',
    nickname: '준호',
    avatar_id: 'clay-02',
    body: '확인 후 다시 질문할게요.',
    created_at: '2026-09-17T09:30:00.000Z',
    post_slug: 'product-log',
    moderation_status: 'hidden' as const,
  },
];

describe('AdminComments', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: comments }),
      }),
    );
  });

  it('상태별 개수와 댓글 정보를 빠르게 보여준다', async () => {
    render(<AdminComments />);

    expect(await screen.findByText('민지')).toBeVisible();
    expect(screen.getByRole('tab', { name: '전체2' })).toBeVisible();
    expect(screen.getByRole('tab', { name: '공개1' })).toBeVisible();
    expect(screen.getByRole('tab', { name: '숨김1' })).toBeVisible();
    expect(screen.getByText('/design-notes')).toBeVisible();
    expect(screen.getAllByText('공개').length).toBeGreaterThan(0);
  });

  it('상태 탭과 닉네임·본문·slug 검색을 함께 적용한다', async () => {
    render(<AdminComments />);
    await screen.findByText('민지');

    fireEvent.click(screen.getByRole('tab', { name: '숨김1' }));
    expect(screen.queryByText('민지')).not.toBeInTheDocument();
    expect(screen.getByText('준호')).toBeVisible();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'design-notes' } });
    expect(screen.getByText('조건에 맞는 댓글이 없어요.')).toBeVisible();
    expect(screen.getByText('다른 상태 탭을 선택하거나 검색어를 바꿔 보세요.')).toBeVisible();
  });

  it('상태 변경과 삭제 액션은 기존 API를 호출하고 목록에 반영한다', async () => {
    const fetchMock = vi.mocked(fetch);
    render(<AdminComments />);
    await screen.findByText('민지');

    fireEvent.click(screen.getByRole('button', { name: '민지 댓글 숨기기' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/comments',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: '준호 댓글 삭제' }));
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(0);
    fireEvent.click(await screen.findByRole('button', { name: '영구 삭제' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/comments',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('부모가 검색어와 일치하지 않아도 조건에 맞는 답글을 표시한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          ...comments,
          {
            ...comments[0],
            id: 'r1',
            parent_id: 'c1',
            is_author: true,
            nickname: 'raven',
            body: '답글에서만 찾는 단어',
          },
        ],
      }),
    } as Response);
    render(<AdminComments />);
    await screen.findByText('민지');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '답글에서만' } });

    expect(screen.getByText('답글에서만 찾는 단어')).toBeVisible();
    expect(screen.queryByText('좋은 글 잘 읽었습니다.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'raven 댓글 숨기기' })).toBeEnabled();
  });

  it('부모가 공개 상태여도 숨김 답글을 숨김 탭에서 관리할 수 있다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          comments[0],
          {
            ...comments[0],
            id: 'r1',
            parent_id: 'c1',
            nickname: 'raven',
            body: '숨긴 답글',
            moderation_status: 'hidden',
          },
        ],
      }),
    } as Response);
    render(<AdminComments />);
    await screen.findByText('민지');

    fireEvent.click(screen.getByRole('tab', { name: '숨김1' }));

    expect(screen.getByText('숨긴 답글')).toBeVisible();
    expect(screen.queryByText('좋은 글 잘 읽었습니다.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'raven 댓글 공개' })).toBeEnabled();
  });
  it('supports arrow keys and Home/End with one tabbable status tab', async () => {
    render(<AdminComments />);
    await screen.findByText('민지');
    const all = screen.getByRole('tab', { name: '전체2' });
    all.focus();
    fireEvent.keyDown(all, { key: 'End' });
    expect(screen.getByRole('tab', { name: '숨김1' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: '숨김1' })).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(all).toHaveFocus();
    expect(screen.getByText(/최근 부모 댓글 최대 200개/)).toBeVisible();
  });
  it('cancel and Escape do not delete; failure keeps the target and confirmation for retry', async () => {
    render(<AdminComments />);
    await screen.findByText('민지');
    fireEvent.click(screen.getByRole('button', { name: '민지 댓글 삭제' }));
    fireEvent.click(await screen.findByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '민지 댓글 삭제' }));
    fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'DELETE'),
    ).toHaveLength(0);
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    fireEvent.click(screen.getByRole('button', { name: '민지 댓글 삭제' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '영구 삭제' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('댓글을 삭제하지 못했어요.');
    expect(dialog).toHaveTextContent('좋은 글 잘 읽었습니다.');
    expect(within(dialog).getByRole('button', { name: '영구 삭제' })).toBeEnabled();
  });
  it('describes child impact and deletes the parent and its replies with one confirmed request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          ...comments,
          { ...comments[0], id: 'r1', parent_id: 'c1', nickname: '작성자', body: '연결 답글' },
        ],
      }),
    } as Response);
    render(<AdminComments />);
    await screen.findByText('민지');
    fireEvent.click(screen.getByRole('button', { name: '민지 댓글 삭제' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('답글 1개가 함께 삭제');
    const confirm = within(dialog).getByRole('button', { name: '영구 삭제' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'DELETE'),
    ).toHaveLength(1);
    expect(screen.queryByText('연결 답글')).not.toBeInTheDocument();
    expect(screen.queryByText('민지')).not.toBeInTheDocument();
    expect(screen.getByText('준호')).toBeVisible();
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveFocus());
  });
});
