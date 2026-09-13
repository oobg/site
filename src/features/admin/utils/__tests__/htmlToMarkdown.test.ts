import { describe, expect, it } from 'vitest';

import { htmlToMarkdown } from '@features/admin/utils/htmlToMarkdown';
import { renderMarkdown } from '@lib/markdown/render';

const root = (html: string) => {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element;
};

describe('htmlToMarkdown', () => {
  it('serializes representative rendered article formatting', () => {
    const markdown = htmlToMarkdown(
      root(`
        <h2 id="section">제목</h2>
        <p><strong>강조</strong>와 <a href="https://example.com/docs">링크</a></p>
        <blockquote><p>인용문</p></blockquote>
        <ul><li>첫 항목</li><li>둘째 항목</li></ul>
        <p><img src="/assets/posts/2026-09-11/image.webp" alt="설계도"></p>
      `),
    );

    expect(markdown).toBe(
      [
        '## 제목',
        '**강조**와 [링크](https://example.com/docs)',
        '> 인용문',
        '- 첫 항목\n- 둘째 항목',
        '![설계도](/assets/posts/2026-09-11/image.webp)',
      ].join('\n\n'),
    );
  });

  it('keeps code and callouts while dropping renderer decorations', () => {
    const markdown = htmlToMarkdown(
      root(`
        <blockquote data-callout="warning">
          <p data-callout-label>주의</p>
          <p>설정을 확인하세요.</p>
        </blockquote>
        <figure data-code>
          <figcaption data-code-head>
            <span data-code-dots><i></i><i></i><i></i></span>
            <span data-code-lang>ts</span>
            <button data-code-copy><span data-code-copy-status>코드 복사</span></button>
          </figcaption>
          <pre class="shiki"><code><span>const value = 1;</span></code></pre>
        </figure>
      `),
    );

    expect(markdown).toBe('> [!WARNING]\n> 설정을 확인하세요.\n\n```ts\nconst value = 1;\n```');
    expect(markdown).not.toContain('주의');
    expect(markdown).not.toContain('코드 복사');
  });

  it('converts a nested filetree into a stable fenced Markdown tree', () => {
    const markdown = htmlToMarkdown(
      root(`
        <figure data-filetree>
          <figcaption>파일 구조</figcaption>
          <ul role="tree">
            <li data-kind="folder">
              <span data-filetree-name>project/</span>
              <ul role="group">
                <li data-kind="folder">
                  <span data-filetree-name>src/</span>
                  <ul role="group">
                    <li data-kind="file"><span data-filetree-name>index.ts</span></li>
                    <li data-kind="folder">
                      <span data-filetree-name>ui/</span>
                      <ul role="group">
                        <li data-kind="file"><span data-filetree-name>Button.tsx</span></li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li data-kind="file"><span data-filetree-name>package.json</span></li>
              </ul>
            </li>
          </ul>
        </figure>
      `),
    );

    expect(markdown).toBe(
      [
        '```filetree',
        'project/',
        '├── src/',
        '│   ├── index.ts',
        '│   └── ui/',
        '│       └── Button.tsx',
        '└── package.json',
        '```',
      ].join('\n'),
    );
  });

  it('uses data-kind and literal names without including renderer labels', () => {
    const markdown = htmlToMarkdown(
      root(`
        <figure data-filetree>
          <figcaption>파일 구조</figcaption>
          <ul role="tree">
            <li data-kind="folder">
              <span data-filetree-name>root &lt;safe&gt;</span>
              <ul role="group">
                <li data-kind="folder"><span data-filetree-name>folder</span></li>
                <li data-kind="file"><span data-filetree-name>name &amp; notes.md</span></li>
              </ul>
            </li>
          </ul>
        </figure>
      `),
    );

    expect(markdown).toContain('root <safe>/');
    expect(markdown).toContain('├── folder/');
    expect(markdown).toContain('└── name & notes.md');
    expect(markdown).not.toContain('폴더');
    expect(markdown).not.toContain('파일 구조');
  });

  it('preserves unsupported pasted element text and rejects unsafe URLs', () => {
    const markdown = htmlToMarkdown(
      root(
        '<custom-card><span>보존할 내용</span></custom-card><p><a href="javascript:alert(1)">안전한 글자</a><img src="data:image/svg+xml,x" alt="이미지 설명"></p>',
      ),
    );

    expect(markdown).toBe('보존할 내용\n\n안전한 글자이미지 설명');
    expect(markdown).not.toContain('javascript:');
    expect(markdown).not.toContain('data:image');
  });

  it.each([
    [
      'mermaid',
      'graph TD\n  A --> B',
      '<figure data-mermaid><span hidden data-mermaid-source>graph TD\n  A --&gt; B</span><div data-mermaid-output><svg></svg></div><div data-mermaid-fallback><figure data-code><pre><code>graph TD\n  A --&gt; B</code></pre></figure></div></figure>',
    ],
    [
      'installer',
      '{\n  "title": "SDK 설치",\n  "steps": [{ "title": "실행", "code": "pnpm add raven" }]\n}',
      '<figure data-installer><span hidden data-installer-source>{\n  &quot;title&quot;: &quot;SDK 설치&quot;,\n  &quot;steps&quot;: [{ &quot;title&quot;: &quot;실행&quot;, &quot;code&quot;: &quot;pnpm add raven&quot; }]\n}</span><header><h3>수정되어도 저장하지 않는 렌더 라벨</h3></header></figure>',
    ],
  ])('round-trips a %s figure to its fenced source', (language, source, html) => {
    expect(htmlToMarkdown(root(html))).toBe(`\`\`\`${language}\n${source}\n\`\`\``);
  });

  it.each([
    ['mermaid', 'flowchart LR\n  Draft --> Review'],
    [
      'installer',
      '{\n  "title": "SDK 설치",\n  "managers": { "pnpm": "pnpm add raven" },\n  "steps": [{ "title": "실행", "language": "sh", "code": "pnpm add raven" }]\n}',
    ],
  ])('returns rendered %s HTML to the original fence', async (language, source) => {
    const markdown = `\`\`\`${language}\n${source}\n\`\`\``;
    const { html } = await renderMarkdown(markdown);
    expect(htmlToMarkdown(root(html))).toBe(markdown);
  });

  it('preserves special fence source whitespace exactly through editor serialization', () => {
    const source =
      '{  \n  "title": "SDK 설치",  \n  "managers": {"npm": "  npm i raven  "},\n  "steps": [{"title":"실행","code":"  echo ready  "}]\n}';
    const html = `<figure data-installer><span hidden data-installer-source>${source}</span></figure>`;

    expect(htmlToMarkdown(root(html))).toBe(`\`\`\`installer\n${source}\n\`\`\``);
  });
});
