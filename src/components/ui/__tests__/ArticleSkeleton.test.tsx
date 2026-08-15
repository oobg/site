import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ArticleSkeleton } from '@components/ui/ArticleSkeleton';

describe('ArticleSkeleton', () => {
  /* 스켈레톤이 대신하는 화면들은 전부 Container 안에 있다. 여기만 빠지면 뷰포트가 읽기
     폭보다 좁을 때 로딩이 끝나는 순간 좌우로 --outer만큼 튄다(실측 390px에서 24px씩).
     데스크톱에서는 두 상태가 같은 자리라 눈으로는 안 보이고, 그래서 한 번 놓쳤다. */
  it('읽기 열을 Container로 감싼다', () => {
    const { container } = render(<ArticleSkeleton />);
    const wrap = container.querySelector('[aria-busy]');
    expect(wrap).not.toBeNull();
    expect(wrap?.parentElement?.className).toMatch(/container/);
  });

  it('불러오는 중임을 스크린리더에 알린다', () => {
    const { container } = render(<ArticleSkeleton />);
    expect(container.querySelector('[aria-busy]')).toHaveAttribute('aria-label', '불러오는 중');
  });
});
