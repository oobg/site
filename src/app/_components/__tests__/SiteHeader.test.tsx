import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteHeader } from '@/app/_components/SiteHeader';

describe('SiteHeader', () => {
  it('홈·글·프로젝트 링크를 올바른 href로 렌더한다', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'raven.kr' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '글' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: '프로젝트' })).toHaveAttribute('href', '/projects');
  });
});
