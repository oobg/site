import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostList } from '@features/admin/components/PostList';

describe('PostList', () => {
  it('빈 목록에서도 필터와 테이블 구조를 유지한다', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByLabelText('글 상태')).toBeVisible();
    expect(screen.getByRole('searchbox', { name: '제목 검색' })).toBeVisible();
    expect(screen.getByRole('list', { name: '글 목록' })).toHaveTextContent(
      '아직 작성한 글이 없어요',
    );
  });
});
