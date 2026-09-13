import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentEnhancements, renderMermaidFigures } from '@components/content/ContentEnhancements';

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
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: 'strict' }));
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
});
