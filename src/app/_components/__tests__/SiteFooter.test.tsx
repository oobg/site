import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from '@/app/_components/SiteFooter';
import styles from '@/app/_components/SiteFooter.module.css';

describe('SiteFooter', () => {
  it('글과 소개 링크만 렌더한다', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('heading', { name: '둘러보기', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '글' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: '프로젝트' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '소개' })).toHaveAttribute('href', '/about');
  });

  /* 레이블과 링크는 둘 다 sans 레지스터를 쓰되 같은 것으로 보이면 안 된다.
     navItem을 레이블에도 붙이던 시절에는 "둘러보기"가 세 번째 링크로 읽혔다. */
  it('둘러보기는 링크가 아니라 링크 위의 레이블이다', () => {
    render(<SiteFooter />);
    const navigation = screen.getByRole('navigation', { name: '사이트 내비게이션' });
    const heading = screen.getByRole('heading', { name: '둘러보기', level: 2 });
    const links = [
      screen.getByRole('link', { name: '글' }),
      screen.getByRole('link', { name: '소개' }),
    ];

    expect(navigation).toContainElement(heading);
    expect(heading).toHaveClass(styles.colLabel);
    expect(heading).not.toHaveClass(styles.navItem);
    for (const link of links) {
      expect(link).toHaveClass(styles.navItem);
      // 레이블은 링크 묶음 밖에 있고, 문서 순서로도 링크보다 앞선다.
      expect(heading).not.toContainElement(link);
      expect(heading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(links[0].parentElement).toBe(links[1].parentElement);
    expect(links[0].parentElement).toHaveClass(styles.columnLinks);
  });

  it('브랜드 설명과 저작권 정보를 유지한다', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'raven.kr' })).toHaveAttribute('href', '/');
    expect(screen.getByText('제품과 소프트웨어를 만들며 남긴 기록이에요.')).toBeInTheDocument();
    expect(screen.getByText('© 2026 raven.kr')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '문의 · dev@raven.kr' })).toHaveAttribute(
      'href',
      'mailto:dev@raven.kr',
    );
  });
});
