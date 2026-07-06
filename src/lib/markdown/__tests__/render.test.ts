import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@lib/markdown/render';

describe('renderMarkdown', () => {
  it('헤딩에 id를 부여하고 toc를 추출한다', async () => {
    const md = '## 왜 헥사고날인가\n\n본문.\n\n### 포트와 어댑터\n\n내용.';
    const { html, toc } = await renderMarkdown(md);
    expect(html).toContain('<h2 id="왜-헥사고날인가"');
    expect(toc).toEqual([
      { id: '왜-헥사고날인가', text: '왜 헥사고날인가', depth: 2 },
      { id: '포트와-어댑터', text: '포트와 어댑터', depth: 3 },
    ]);
  });

  it('코드펜스를 shiki로 하이라이트한다', async () => {
    const md = '```ts\nconst x = 1;\n```';
    const { html } = await renderMarkdown(md);
    expect(html).toContain('<pre');
    expect(html).toContain('shiki');
    expect(html).toContain('github-light');
  });

  it('h1/h4는 toc에 넣지 않는다', async () => {
    const { toc } = await renderMarkdown('# 제목\n\n#### 작은제목');
    expect(toc).toEqual([]);
  });
});
