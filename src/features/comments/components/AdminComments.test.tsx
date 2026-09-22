import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/comments',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });
});
