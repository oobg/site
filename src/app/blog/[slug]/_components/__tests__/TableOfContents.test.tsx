import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';

const TOC = [
  { id: '왜-헥사고날인가', text: '왜 헥사고날인가', depth: 2 },
  { id: '포트와-어댑터', text: '포트와 어댑터', depth: 3 },
];

/** 본문 제목을 문서에 심고 각자의 화면상 위치를 정한다. */
function placeHeadings(tops: number[]) {
  const host = document.createElement('div');
  host.innerHTML = TOC.map((entry) => `<h2 id="${entry.id}">${entry.text}</h2>`).join('');
  document.body.append(host);
  TOC.forEach((entry, index) => {
    const el = document.getElementById(entry.id);
    if (el) el.getBoundingClientRect = () => ({ top: tops[index] }) as DOMRect;
  });
  return host;
}

const activeNames = () =>
  screen
    .getAllByRole('link')
    .filter((el) => /active/.test(el.className))
    .map((el) => el.textContent);

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('TableOfContents', () => {
  it('toc 항목을 앵커 링크로 렌더한다', () => {
    render(<TableOfContents toc={TOC} />);
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

  it('첫 제목에 닿기 전에는 아무것도 표시하지 않는다', async () => {
    // 기준선은 innerHeight의 30%. 두 제목 모두 그보다 아래에 있다.
    placeHeadings([window.innerHeight, window.innerHeight + 200]);
    render(<TableOfContents toc={TOC} />);
    await waitFor(() => expect(activeNames()).toEqual([]));
  });

  it('기준선 위의 마지막 제목을 현재 위치로 표시한다', async () => {
    const line = window.innerHeight * 0.3;
    placeHeadings([line - 50, line + 300]);
    render(<TableOfContents toc={TOC} />);
    await waitFor(() => expect(activeNames()).toEqual(['왜 헥사고날인가']));
  });

  /* 예전 구현은 상단 밴드를 IntersectionObserver로 관찰해서, 밴드를 건너뛰는
     이동에서는 교차 상태가 false에서 false로 갈 뿐이라 콜백이 오지 않았다.
     목차 링크로 점프하면 표시가 죽었다. */
  it('제목을 모두 지나치는 점프에서도 마지막 제목을 잡는다', async () => {
    const line = window.innerHeight * 0.3;
    const host = placeHeadings([line - 400, line - 100]);
    render(<TableOfContents toc={TOC} />);
    await waitFor(() => expect(activeNames()).toEqual(['포트와 어댑터']));
    host.remove();
  });
});
