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
});
