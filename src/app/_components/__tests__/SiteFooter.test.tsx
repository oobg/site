import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from '@/app/_components/SiteFooter';

describe('SiteFooter', () => {
  it('내비게이션에 글, 프로젝트, 소개 링크를 렌더한다', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: '글' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '프로젝트' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: '소개' })).toHaveAttribute('href', '/about');
  });
});
