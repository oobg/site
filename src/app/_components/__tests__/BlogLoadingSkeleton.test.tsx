import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  BlogArchiveSkeleton,
  BlogArticleLinksSkeleton,
  BlogArticleSkeleton,
  BlogHomeSkeleton,
} from '@/app/_components/BlogLoadingSkeleton';

describe('BlogLoadingSkeleton', () => {
  it('홈의 sidebar와 세 카드 열 자리를 함께 유지한다', () => {
    const { container } = render(<BlogHomeSkeleton />);
    expect(container.querySelector('[aria-busy]')).toHaveAttribute('aria-label', '불러오는 중');
    expect(container.querySelector('aside')).not.toBeNull();
    expect(container.querySelectorAll('article')).toHaveLength(9);
  });

  it('상세 글의 shell과 article 읽기 열 자리를 함께 유지한다', () => {
    const { container } = render(<BlogArticleSkeleton />);
    expect(container.querySelector('aside')).not.toBeNull();
    expect(container.querySelector('article')).not.toBeNull();
  });

  it('검색과 필터 결과의 archive 카드 열 자리를 유지한다', () => {
    const { container } = render(<BlogArchiveSkeleton />);
    expect(container.querySelector('[aria-label="글 목록을 불러오는 중"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelectorAll('article')).toHaveLength(12);
  });

  it('본문 아래의 관련 글만 로딩 상태로 표시한다', () => {
    const { container } = render(<BlogArticleLinksSkeleton />);
    expect(container.querySelector('[aria-label="관련 글을 불러오는 중"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelector('article')).toBeNull();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(8);
  });
});
