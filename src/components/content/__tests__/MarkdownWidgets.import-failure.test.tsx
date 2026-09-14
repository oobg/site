import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownWidgets } from '@components/content/MarkdownWidgets';

vi.mock('mermaid', () => {
  throw new Error('failed to load Mermaid chunk');
});

describe('MarkdownWidgets Mermaid import failure', () => {
  it('marks the diagram as failed and leaves its source fallback exposed', async () => {
    document.body.innerHTML = `
      <figure data-mermaid data-mermaid-state="loading">
        <span data-mermaid-source>graph TD\nA --&gt; B</span>
        <div data-mermaid-output><svg><text>stale output</text></svg></div>
        <div data-mermaid-fallback><pre><code>graph TD\nA --&gt; B</code></pre></div>
      </figure>`;

    render(<MarkdownWidgets />);

    await waitFor(() =>
      expect(document.querySelector('[data-mermaid]')).toHaveAttribute(
        'data-mermaid-state',
        'error',
      ),
    );
    expect(document.querySelector('[data-mermaid-output]')).toBeEmptyDOMElement();
    expect(document.querySelector('[data-mermaid-fallback]')).toHaveTextContent('graph TD A --> B');
  });
});
