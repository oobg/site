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
  });

  /* shiki는 pre에 배경색을 인라인으로 박아서 CSS로 덮을 수 없다. 테마를 바꿔도
     코드블럭이 페이지와 같은 계조에 앉는지가 지켜야 할 것이고, 테마 이름은 아니다. */
  it('코드블럭 배경을 페이지 토큰으로 넘긴다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('background-color:var(--color-canvas-2)');
    expect(html).not.toContain('background-color:#fff');
  });

  it('코드블럭을 창틀로 감싸고 언어를 라벨로 남긴다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('<figure data-code');
    expect(html).toContain('data-code-lang=""');
    expect(html).toMatch(/data-code-lang=""[^>]*>ts</);
  });

  it('코드블럭마다 복사 버튼을 심는다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```\n\n```\nplain\n```');
    expect(html.match(/data-code-copy=""/g)).toHaveLength(2);
    /* 상태 문구는 초점이 이미 버튼에 있을 때도 읽히도록 aria-live로 둔다.
       aria-label만 바꾸면 바뀐 이름이 다시 읽히지 않는다. */
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('코드 복사');
  });

  it('언어를 안 적은 코드펜스도 창틀은 붙이되 라벨은 비운다', async () => {
    const { html } = await renderMarkdown('```\nplain\n```');
    expect(html).toContain('<figure data-code');
    expect(html).toMatch(/data-code-lang=""[^>]*><\/span>/);
  });

  it('h1/h4는 toc에 넣지 않는다', async () => {
    const { toc } = await renderMarkdown('# 제목\n\n#### 작은제목');
    expect(toc).toEqual([]);
  });
});
