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

  it('round-trips rendered filetree decorations without serializing them', async () => {
    const source = ['```filetree', 'project/', '└── src/', '    └── index.ts', '```'].join('\n');
    const { html } = await renderMarkdown(source);

    expect(html).toContain('data-filetree-icon="folder"');
    expect(html).toContain('data-filetree-icon="ts"');
    expect(html).toContain('alt="" aria-hidden="true"');
    expect(html).toContain('data-code-dots="" aria-hidden="true"');
    expect(html).toContain('data-code-lang="">파일 구조</span>');
    expect(htmlToMarkdown(root(html))).toBe(source);
    expect(htmlToMarkdown(root(html))).not.toContain('filetree-icons');
  });

  it.each([
    ['mermaid', 'flowchart TD\n  A --> B'],
    [
      'installer',
      JSON.stringify(
        {
          title: 'CLI 설치',
          intro: '패키지 매니저를 선택하세요.',
          managers: { npm: 'npm install raven', pnpm: 'pnpm add raven' },
          steps: [
            { title: '설정', code: 'raven init', language: 'sh', note: '한 번만 실행합니다.' },
          ],
        },
        null,
        2,
      ),
    ],
  ])('rendered %s 컴포넌트를 원래 fenced Markdown으로 되돌린다', async (kind, value) => {
    const source = `\`\`\`${kind}\n${value}\n\`\`\``;
    const { html } = await renderMarkdown(source);
    expect(htmlToMarkdown(root(html))).toBe(source);
  });

  it('컴포넌트 태그가 바뀌어도 숨겨 둔 source를 공백까지 그대로 직렬화한다', async () => {
    const value = JSON.stringify({
      title: 'CLI 설치',
      managers: { npm: '  npm install raven  ' },
      steps: [{ title: '설정', code: '  raven init\n  ' }],
    });
    const source = `\`\`\`installer\n${value}\n\n\`\`\``;
    const { html } = await renderMarkdown(source);
    const rendered = root(html);
    const component = rendered.querySelector('[data-installer]');
    expect(component).not.toBeNull();
    const article = document.createElement('article');
    for (const attribute of Array.from(component!.attributes)) {
      article.setAttribute(attribute.name, attribute.value);
    }
    article.innerHTML = component!.innerHTML;
    component!.replaceWith(article);

    expect(htmlToMarkdown(rendered)).toBe(source);
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
});
