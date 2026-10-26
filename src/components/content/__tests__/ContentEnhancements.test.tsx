import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentEnhancements, renderMermaidFigures } from '@components/content/ContentEnhancements';
import { CodeCopy } from '@components/content/CodeCopy';
import { renderMarkdown } from '@lib/markdown/render';

const initialize = vi.fn();
const mermaidRender = vi.fn();

vi.mock('mermaid', () => ({
  default: { initialize, render: mermaidRender },
}));

function Fixture({ source = 'flowchart LR\nA --> B' }: { source?: string }) {
  return (
    <>
      <ContentEnhancements />
      <section data-mermaid data-mermaid-state="pending">
        <div data-mermaid-source hidden>
          {source}
        </div>
        <div data-mermaid-canvas role="img" aria-label="다이어그램 1" />
        <div data-mermaid-fallback hidden>
          <pre>
            <code>{source}</code>
          </pre>
        </div>
        <p data-mermaid-status role="status">
          불러오는 중
        </p>
      </section>
      <section data-installer>
        <div role="tablist">
          <button role="tab" aria-controls="npm-panel" aria-selected="true" tabIndex={0}>
            npm
          </button>
          <button role="tab" aria-controls="pnpm-panel" aria-selected="false" tabIndex={-1}>
            pnpm
          </button>
        </div>
        <div id="npm-panel" role="tabpanel">
          npm install raven
        </div>
        <div id="pnpm-panel" role="tabpanel" hidden>
          pnpm add raven
        </div>
      </section>
    </>
  );
}

describe('ContentEnhancements', () => {
  beforeEach(() => {
    initialize.mockClear();
    mermaidRender.mockReset();
  });

  it('strict Mermaid 결과를 활성화하고 실행 가능한 SVG 기능을 제거한다', async () => {
    mermaidRender.mockResolvedValue({
      svg: `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
        <script>alert(1)</script><foreignObject><iframe src="https://evil.test" /></foreignObject>
        <style>@import url(//evil.test/x.css); .bad { fill: url(data:image/svg+xml,x) }</style>
        <a href="javascript:alert(1)"><text>안전</text></a>
        <image href="//evil.test/x.png" />
        <use href="icons.svg#external" />
        <rect style="fill:url(data:image/svg+xml,x)" filter="url(javascript:alert(1))" />
        <path marker-end="url(#arrow)" />
      </svg>`,
    });
    render(<Fixture />);

    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'ready',
      ),
    );
    expect(mermaidRender).toHaveBeenCalledWith(
      expect.stringMatching(/^mermaid-diagram-/),
      'flowchart LR\nA --> B',
    );
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: 'strict', htmlLabels: false }),
    );
    expect(document.querySelector('[data-mermaid-canvas] script')).toBeNull();
    expect(document.querySelector('[data-mermaid-canvas] foreignObject')).toBeNull();
    expect(document.querySelector('[data-mermaid-canvas] a')).not.toHaveAttribute('href');
    expect(document.querySelector('[data-mermaid-canvas] image')).not.toHaveAttribute('href');
    expect(document.querySelector('[data-mermaid-canvas] use')).not.toHaveAttribute('href');
    expect(document.querySelector('[data-mermaid-canvas] rect')).not.toHaveAttribute('style');
    expect(document.querySelector('[data-mermaid-canvas] rect')).not.toHaveAttribute('filter');
    expect(document.querySelector('[data-mermaid-canvas] path')).toHaveAttribute(
      'marker-end',
      'url(#arrow)',
    );
    expect(document.querySelector('[data-mermaid-canvas] style')).toBeNull();
    expect(document.querySelector('[data-mermaid-canvas] svg')).not.toHaveAttribute('onload');
    expect(document.querySelector('[data-mermaid-fallback]')).toHaveAttribute('hidden');
  });

  it('Mermaid 파싱 실패 시 원문 코드블럭을 표시한다', async () => {
    mermaidRender.mockRejectedValue(new Error('parse failed'));
    render(<Fixture source="not a diagram" />);

    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'fallback',
      ),
    );
    expect(document.querySelector('[data-mermaid-canvas]')).toHaveAttribute('hidden');
    expect(document.querySelector('[data-mermaid-fallback]')).not.toHaveAttribute('hidden');
    expect(screen.getByRole('status')).toHaveTextContent('원문으로');
  });

  it('Mermaid 모듈 import 실패 시에도 원문 코드블럭을 표시한다', async () => {
    render(<Fixture source="flowchart TD\nA --> B" />);
    const figure = document.querySelector<HTMLElement>('[data-mermaid]')!;
    figure.dataset.mermaidState = 'pending';

    await renderMermaidFigures(document, async () => {
      throw new Error('chunk load failed');
    });

    expect(figure).toHaveAttribute('data-mermaid-state', 'fallback');
    expect(document.querySelector('[data-mermaid-canvas]')).toHaveAttribute('hidden');
    expect(document.querySelector('[data-mermaid-fallback]')).not.toHaveAttribute('hidden');
  });

  it('installer 탭을 클릭과 방향키로 전환한다', async () => {
    mermaidRender.mockResolvedValue({ svg: '<svg xmlns="http://www.w3.org/2000/svg" />' });
    render(<Fixture />);
    const npm = screen.getByRole('tab', { name: 'npm' });
    const pnpm = screen.getByRole('tab', { name: 'pnpm' });

    fireEvent.click(pnpm);
    expect(pnpm).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: '' })).toBeTruthy();
    expect(document.querySelector('#npm-panel')).toHaveAttribute('hidden');
    expect(document.querySelector('#pnpm-panel')).not.toHaveAttribute('hidden');

    await act(async () => fireEvent.keyDown(pnpm, { key: 'ArrowLeft' }));
    expect(npm).toHaveAttribute('aria-selected', 'true');
    expect(npm).toHaveFocus();
    expect(mermaidRender).toHaveBeenCalledTimes(1);
  });

  it('빈 원문은 로딩 상태에 남기지 않고 fallback으로 종료한다', async () => {
    render(<Fixture source="   " />);
    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'fallback',
      ),
    );
    expect(mermaidRender).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('원문으로');
  });

  it('미리보기에 다이어그램 루트가 직접 추가되어도 한 번만 활성화한다', async () => {
    mermaidRender.mockResolvedValue({ svg: '<svg xmlns="http://www.w3.org/2000/svg" />' });
    const { container } = render(<ContentEnhancements />);
    const figure = document.createElement('section');
    figure.setAttribute('data-mermaid', '');
    figure.dataset.mermaidState = 'pending';
    figure.innerHTML =
      '<div data-mermaid-source>flowchart LR\nA --> B</div>' +
      '<div data-mermaid-canvas></div><div data-mermaid-fallback hidden></div>';
    container.append(figure);

    await waitFor(() => expect(figure).toHaveAttribute('data-mermaid-state', 'ready'));
    expect(mermaidRender).toHaveBeenCalledTimes(1);
  });

  it('페이지를 떠난 뒤 완료된 다이어그램은 분리된 DOM에 반영하지 않는다', async () => {
    let completeRender: ((value: { svg: string }) => void) | undefined;
    mermaidRender.mockReturnValueOnce(
      new Promise<{ svg: string }>((resolve) => {
        completeRender = resolve;
      }),
    );
    const { container, unmount } = render(<Fixture />);
    const canvas = container.querySelector('[data-mermaid-canvas]')!;
    await waitFor(() => expect(mermaidRender).toHaveBeenCalledTimes(1));
    unmount();

    await act(async () =>
      completeRender?.({ svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>old</text></svg>' }),
    );

    expect(canvas).toBeEmptyDOMElement();
  });
});

async function renderArticleFixture(source: string) {
  const { html } = await renderMarkdown(`\`\`\`mermaid\n${source}\n\`\`\``);
  render(
    <>
      <ContentEnhancements />
      <CodeCopy />
      <article data-article-body dangerouslySetInnerHTML={{ __html: html }} />
    </>,
  );
}

describe('renderMarkdown Mermaid integration', () => {
  const source = 'flowchart LR\nA["원문 & <태그>"] --> B';
  const writeText = vi.fn();
  beforeEach(() => {
    mermaidRender.mockReset();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });
  it('성공한 도식의 실제 원문 접이식을 열고 원문 그대로 복사한다', async () => {
    mermaidRender.mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>도식</text></svg>',
    });
    await renderArticleFixture(source);
    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'ready',
      ),
    );
    const details = document.querySelector<HTMLDetailsElement>(
      'details[data-mermaid-source-toggle]',
    );
    expect(details).not.toBeNull();
    expect(details!.open).toBe(false);
    expect(document.querySelector('[data-mermaid-fallback]')).not.toHaveAttribute('hidden');
    fireEvent.click(screen.getByText('다이어그램 원문 보기'));
    expect(details!.open).toBe(true);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '코드 복사' })));
    expect(writeText).toHaveBeenCalledWith(source);
    expect(screen.getByText('복사됨')).toBeInTheDocument();
    expect(mermaidRender).toHaveBeenCalledWith(expect.any(String), source);
  });
  it('실제 renderer 원문을 파싱 실패 후 자동으로 펼친다', async () => {
    mermaidRender.mockRejectedValue(new Error('parse failed'));
    await renderArticleFixture(source);
    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'fallback',
      ),
    );
    const details = document.querySelector<HTMLDetailsElement>(
      'details[data-mermaid-source-toggle]',
    );
    expect(details).not.toBeNull();
    expect(details!.open).toBe(true);
    expect(document.querySelector('[data-mermaid-fallback] code')).toHaveTextContent(
      source.replace(/\n/g, ' '),
    );
    expect(document.querySelector('[data-mermaid-canvas]')).toHaveAttribute('hidden');
  });
});

describe('file tree overflow keyboard access', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('루트 ul에 넘칠 때만 키보드 접근과 스크롤 이름을 주고 해소되면 원래 이름을 복원한다', async () => {
    let resize!: ResizeObserverCallback;
    const observe = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe = observe;
        disconnect = vi.fn();
      },
    );
    const { html } = await renderMarkdown('```filetree\nproject/\n└── very-long-filename.ts\n```');
    render(<article data-article-body dangerouslySetInnerHTML={{ __html: html }} />);
    const root = document.querySelector<HTMLElement>('[data-filetree] > ul')!;
    let width = 100;
    Object.defineProperties(root, {
      clientWidth: { get: () => 100 },
      scrollWidth: { get: () => width },
    });
    const enhancements = render(<ContentEnhancements contentKey="first" />);
    expect(observe).toHaveBeenCalledWith(root);
    expect(root).not.toHaveAttribute('tabindex');
    expect(root).toHaveAttribute('aria-label', '파일 트리');
    expect(root).not.toHaveAttribute('role');
    const entry: ResizeObserverEntry = {
      target: root,
      contentRect: root.getBoundingClientRect(),
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };
    width = 500;
    act(() => resize([entry], {} as ResizeObserver));
    expect(root).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('aria-label', '가로로 스크롤할 수 있는 파일 트리');
    expect(root.querySelector('ul')).not.toHaveAttribute('tabindex');
    enhancements.rerender(<ContentEnhancements contentKey="refreshed" />);
    width = 100;
    act(() => resize([entry], {} as ResizeObserver));
    expect(root).not.toHaveAttribute('tabindex');
    expect(root).not.toHaveAttribute('data-horizontal-scroll');
    expect(root).toHaveAttribute('aria-label', '파일 트리');
    expect(root).not.toHaveAttribute('role');
  });
});
