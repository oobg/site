import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';

beforeAll(() => {
  // jsdom에는 IntersectionObserver가 없다 → 스텁
  class IO {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

describe('TableOfContents', () => {
  it('toc 항목을 앵커 링크로 렌더한다', () => {
    render(
      <TableOfContents
        toc={[
          { id: '왜-헥사고날인가', text: '왜 헥사고날인가', depth: 2 },
          { id: '포트와-어댑터', text: '포트와 어댑터', depth: 3 },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: '왜 헥사고날인가' })).toHaveAttribute(
      'href',
      '#왜-헥사고날인가',
    );
    expect(screen.getByRole('link', { name: '포트와 어댑터' })).toHaveAttribute(
      'href',
      '#포트와-어댑터',
    );
  });
  it('toc가 비면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<TableOfContents toc={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
