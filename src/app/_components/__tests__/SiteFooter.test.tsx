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

  it('브랜드 설명과 저작권 정보를 유지한다', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'raven.kr' })).toHaveAttribute('href', '/');
    expect(screen.getByText('제품과 소프트웨어를 만들며 남긴 기록이에요.')).toBeInTheDocument();
    expect(screen.getByText('© 2026 raven.kr')).toBeInTheDocument();
  });
});
