import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkdownWidgets } from '@components/content/MarkdownWidgets';

const { initialize, renderMermaid } = vi.hoisted(() => ({
  initialize: vi.fn(),
  renderMermaid: vi.fn(),
}));

vi.mock('mermaid', () => ({
  default: { initialize, render: renderMermaid },
}));

describe('MarkdownWidgets', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    initialize.mockClear();
    renderMermaid.mockReset();
  });

  it('activates Mermaid SVG and removes executable output surfaces', async () => {
    document.body.innerHTML = `
      <figure data-mermaid data-mermaid-state="loading">
        <span data-mermaid-source>graph TD\nA --&gt; B</span>
        <div data-mermaid-output></div>
        <div data-mermaid-fallback><pre><code>graph TD</code></pre></div>
      </figure>`;
    renderMermaid.mockResolvedValue({
      svg: `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
        <script>alert(1)</script>
        <a href="javascript:alert(1)"><text>안전한 라벨</text></a>
        <image href="data:image/svg+xml,danger" />
        <use href="//evil.example/icon.svg#x" />
        <foreignObject><div>html</div></foreignObject>
        <iframe src="https://evil.example/embed"></iframe>
        <style>@import url("https://evil.example/theme.css"); .node { fill: red; }</style>
        <rect style="fill: url(https://evil.example/paint.svg#x)" />
        <path style="fill: url(#safe-gradient)" />
      </svg>`,
    });

    render(<MarkdownWidgets />);

    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'ready',
      ),
    );
    const output = document.querySelector('[data-mermaid-output]')!;
    expect(renderMermaid).toHaveBeenCalledWith(
      expect.stringMatching(/^raven-mermaid-/),
      'graph TD\nA --> B',
    );
    expect(output.innerHTML).toContain('안전한 라벨');
    expect(output.innerHTML).not.toMatch(
      /script|foreignObject|iframe|onload|javascript:|data:image|\/\/evil|@import|evil\.example/i,
    );
    expect(output.innerHTML).toContain('url(#safe-gradient)');
  });

  it('leaves the source fallback visible when Mermaid rejects the diagram', async () => {
    document.body.innerHTML = `
      <figure data-mermaid data-mermaid-state="loading">
        <span data-mermaid-source>not a diagram</span>
        <div data-mermaid-output></div>
        <div data-mermaid-fallback><pre><code>not a diagram</code></pre></div>
      </figure>`;
    renderMermaid.mockRejectedValue(new Error('syntax'));

    render(<MarkdownWidgets />);

    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'error',
      ),
    );
    expect(document.querySelector('[data-mermaid-fallback]')).toHaveTextContent('not a diagram');
    expect(document.querySelector('[data-mermaid-output]')).toBeEmptyDOMElement();
  });

  it('switches installer panels with click and keyboard tabs', () => {
    document.body.innerHTML = `
      <figure data-installer>
        <div role="tablist">
          <button role="tab" data-installer-manager="pnpm" aria-selected="true" tabindex="0">pnpm</button>
          <button role="tab" data-installer-manager="npm" aria-selected="false" tabindex="-1">npm</button>
        </div>
        <div data-installer-panel="pnpm">pnpm add raven</div>
        <div data-installer-panel="npm" hidden>npm install raven</div>
      </figure>`;
    render(<MarkdownWidgets />);
    const pnpm = document.querySelector<HTMLButtonElement>('[data-installer-manager="pnpm"]')!;
    const npm = document.querySelector<HTMLButtonElement>('[data-installer-manager="npm"]')!;

    fireEvent.click(npm);
    expect(npm).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('[data-installer-panel="npm"]')).not.toHaveAttribute('hidden');
    expect(document.querySelector('[data-installer-panel="pnpm"]')).toHaveAttribute('hidden');

    fireEvent.keyDown(npm, { key: 'ArrowLeft' });
    expect(pnpm).toHaveAttribute('aria-selected', 'true');
    expect(pnpm).toHaveFocus();
  });

  it('activates a dynamically inserted preview diagram exactly once', async () => {
    renderMermaid.mockResolvedValue({ svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' });
    render(<MarkdownWidgets />);

    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = `
      <figure data-mermaid data-mermaid-state="loading">
        <span data-mermaid-source>graph TD\nA --&gt; B</span>
        <div data-mermaid-output></div>
        <div data-mermaid-fallback><pre><code>graph TD</code></pre></div>
      </figure>`;

    await waitFor(() =>
      expect(container.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'ready',
      ),
    );
    expect(renderMermaid).toHaveBeenCalledTimes(1);
  });
});
