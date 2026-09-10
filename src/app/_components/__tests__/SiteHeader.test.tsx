import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteHeader } from '@/app/_components/SiteHeader';

describe('SiteHeader', () => {
  it('홈, 소개, 프로젝트, 검색 링크를 올바른 href로 렌더한다', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'raven' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: '프로젝트' })[0]).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(screen.getAllByRole('link', { name: '소개' })[0]).toHaveAttribute('href', '/about');
    expect(screen.getAllByRole('link', { name: '검색' })[0]).toHaveAttribute(
      'href',
      '/#archive-title',
    );
    expect(screen.getByRole('button', { name: '메뉴 열기' })).toBeInTheDocument();
  });
});
