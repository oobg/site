import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TagFilter } from '@/app/blog/_components/TagFilter';

describe('TagFilter', () => {
  it('전체 + 각 태그 링크를 렌더하고 활성 태그를 표시한다', () => {
    render(<TagFilter tags={['nestjs', 'nextjs']} active="nestjs" />);
    const all = screen.getByRole('link', { name: '전체' });
    expect(all).toHaveAttribute('href', '/blog');
    const nestjs = screen.getByRole('link', { name: '#nestjs' });
    expect(nestjs).toHaveAttribute('href', '/blog?tag=nestjs');
    expect(nestjs).toHaveAttribute('aria-current', 'true');
  });

  it('선택 여부와 상관없이 모든 항목이 칩 모양을 갖는다', () => {
    // .active가 .chip을 대체하면 선택된 항목만 여백·보더·라운딩을 잃는다.
    // 선택은 같은 모양 위의 상태 변화여야 하고, 다른 모양이 되면 종류 차이로 읽힌다.
    render(<TagFilter tags={['nestjs', 'nextjs']} active="nestjs" />);
    for (const name of ['전체', '#nestjs', '#nextjs']) {
      const el = screen.getByRole('link', { name });
      expect(el.className).toMatch(/chip/);
    }
  });
});
