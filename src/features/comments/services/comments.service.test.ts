import { describe, expect, it } from 'vitest';
import { buildCommentPage } from '@features/comments/services/comments.service';
import type { Comment } from '@features/comments/types/comments.types';

const comment = (index: number): Comment => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  nickname: '익명',
  avatar_id: 'clay-01',
  body: `댓글 ${index}`,
  created_at: new Date(Date.UTC(2026, 8, 11, 0, 0, index)).toISOString(),
});

describe('buildCommentPage', () => {
  it('cursor 페이지가 달라도 전체 visible 댓글 수를 유지한다', () => {
    const first = buildCommentPage(
      Array.from({ length: 21 }, (_, index) => comment(index)),
      34,
    );
    const second = buildCommentPage(
      Array.from({ length: 14 }, (_, index) => comment(index + 20)),
      34,
    );
    expect(first).toMatchObject({ total: 34 });
    expect(first.nextCursor).not.toBeNull();
    expect(second).toMatchObject({ total: 34, nextCursor: null });
  });
});
