import { afterEach, describe, expect, it, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { renderMarkdown } from '@lib/markdown/render';
import { htmlToMarkdown } from '@features/admin/utils/htmlToMarkdown';
import { isTextEditingSafe } from '@features/admin/utils/textEditingSafety';

const parser = unified().use(remarkParse).use(remarkGfm);
const ast = (source: string) =>
  JSON.stringify(parser.parse(source), (key, value) => (key === 'position' ? undefined : value));

async function roundTrip(source: string) {
  const { html } = await renderMarkdown(source, { assetPublicUrl: '' });
  const root = document.createElement('div');
  root.innerHTML = html;
  return { html, markdown: htmlToMarkdown(root) };
}

const escaped = [
  '\\# 일반 문장',
  '\\## 소제목 아님',
  '\\> 인용 아님',
  '\\- 목록 아님',
  '\\+ 목록 아님',
  '1\\. 목록 아님',
  '1\\) 목록 아님',
  '\\---',
  '첫줄\n\\---',
  '첫줄\n\\===',
  '첫줄\n\\> 인용 아님',
  'a | b\n\\--- | ---',
  '\\~\\~취소선 아님\\~\\~',
];

describe('isTextEditingSafe', () => {
  afterEach(() => vi.restoreAllMocks());
  it.each(escaped)('역변환으로 재해석되는 decoded 구문 차단: %s', (source) => {
    expect(isTextEditingSafe(source)).toBe(false);
  });
  it.each([
    '각주[^1]\n\n[^1]: 설명',
    '[^unused]: 참조 없는 각주',
    '<div>HTML</div>',
    '[링크][ref]\n\n[ref]: https://example.com',
    '[ref]: https://example.com',
    '[링크](https://example.com "제목")',
    '![이미지](/assets/image.png "설명")',
    '```js title="example"\ncode\n```',
    '| a | b |\n|:---|---:|\n|1|2|',
    '[링크](javascript:alert)',
  ])('의미 보존을 입증하지 못한 구조/속성 차단: %s', (source) => {
    expect(isTextEditingSafe(source)).toBe(false);
  });
  it.each([
    '',
    '일반 문단',
    '# 제목\n\n**강조**와 *기울임*과 ~~취소선~~',
    '> 인용문\n\n- 목록\n- 두 번째\n\n1. 순서 목록',
    '- [x] 완료\n- [ ] 할 일',
    '- first\n  - child',
    '- first\n\n1. ordered',
    '[링크](https://example.com)와 ![이미지](/assets/image.png)',
    '| a | b |\n|---|---|\n|1|2|',
    '> [!NOTE]\n> 설명',
    '```filetree\nproject/\n└── file.ts\n```',
    '```mermaid\ngraph TD\nA --> B\n```',
    '```installer\n{"steps": []}\n```',
    ...escaped.map((source) => `\`\`\`text\n${source}\n\`\`\``),
    '`\\# 문장 [^1]`',
    '위험 표본은 `> 인용`과 `- 목록` 코드',
    '\\* 별표와 \\[대괄호\\]는 기존 변환이 보호한다',
  ])('기존 지원 서식 및 코드 내부 표본 허용: %s', (source) => {
    expect(isTextEditingSafe(source)).toBe(true);
  });
  it.each([
    { type: 'futureExtension', value: 'unknown' },
    { type: 'paragraph', children: [{ type: 'text', value: '본문' }], newAttribute: true },
    { type: 'code', value: 'code', lang: 'text', meta: null, data: { unproven: true } },
  ])('파서의 미확인 노드/속성을 안전하다고 선언하지 않는다', (node) => {
    vi.spyOn(Object.getPrototypeOf(unified()), 'parse').mockReturnValueOnce({
      type: 'root',
      children: [node],
    });
    expect(isTextEditingSafe('본문')).toBe(false);
  });
  it.each([
    '- first\n  - child\n\n  continuation',
    '- first\n\n* second',
    '- first\n\n- second',
    '첫줄\n둘째줄\n===',
  ])('실제 역변환에서 순서나 경계가 바뀌는 목록 진입을 차단한다: %s', async (source) => {
    const { html } = await renderMarkdown(source);
    const root = document.createElement('div');
    root.innerHTML = html;
    const converted = htmlToMarkdown(root);
    const parser = unified().use(remarkParse).use(remarkGfm);
    const structure = (value: string) =>
      JSON.stringify(parser.parse(value), (key, child) => (key === 'position' ? undefined : child));
    expect(structure(converted)).not.toBe(structure(source));
    expect(isTextEditingSafe(source)).toBe(false);
  });

  it.each([0, 3])('순서 목록 시작 번호 %i를 실제 렌더와 역변환이 유지한다', async (start) => {
    const source = `${start}. 첫 항목\n${start + 1}. 둘째 항목`;
    expect(isTextEditingSafe(source)).toBe(true);
    const { html } = await renderMarkdown(source);
    const root = document.createElement('div');
    root.innerHTML = html;
    expect(root.querySelector('ol')?.start).toBe(start);
    expect(htmlToMarkdown(root)).toBe(source);
  });

  it('파싱 실패는 안전하지 않은 것으로 판정한다', () => {
    vi.spyOn(Object.getPrototypeOf(unified()), 'parse').mockImplementationOnce(() => {
      throw new Error('parse failed');
    });
    expect(isTextEditingSafe('본문')).toBe(false);
  });
});

describe('C-02 후속 구조 반례', () => {
  it.each([
    '999999999. 마지막 항목',
    '999999998. 첫 항목\n999999999. 마지막 항목',
    '- 항목\n  - 안쪽 항목',
    '- > 인용\n  > 두 줄',
    '- ```text\n  코드\n  ```',
    '- # 제목',
  ])('경계 번호와 보존되는 단일 블록·중첩 목록을 허용한다: %s', async (source) => {
    const { html, markdown } = await roundTrip(source);
    expect(ast(markdown)).toBe(ast(source));
    expect((await renderMarkdown(markdown)).html).toBe(html);
    expect(isTextEditingSafe(source)).toBe(true);
  });

  it.each(['``  a  ``', '\\~\\~취소선 아님\\~\\~'])(
    '표 셀 문맥에서도 인라인 의미 손실을 차단한다: %s',
    async (cell) => {
      const source = `| ${cell} |\n| --- |`;
      const { markdown } = await roundTrip(source);
      expect(ast(markdown)).not.toBe(ast(source));
      expect(isTextEditingSafe(source)).toBe(false);
    },
  );

  it('표 셀의 block marker를 허용해도 정렬 손실은 차단한다', async () => {
    const source = '| # 제목 | 값 |\n| :--- | ---: |\n| a | b |';
    const { markdown } = await roundTrip(source);
    expect(ast(markdown)).not.toBe(ast(source));
    expect(isTextEditingSafe(source)).toBe(false);
  });

  it('blocks an ordered list whose next serialized marker exceeds nine digits', async () => {
    const source = '999999999. 첫 항목\n999999999. 둘째 항목';
    const { html, markdown } = await roundTrip(source);
    const root = document.createElement('div');
    root.innerHTML = html;
    expect(root.querySelectorAll('li')).toHaveLength(2);
    const converted = await renderMarkdown(markdown);
    root.innerHTML = converted.html;
    expect(markdown).toBe('999999999. 첫 항목\n1000000000. 둘째 항목');
    expect(root.querySelectorAll('li')).toHaveLength(1);
    expect(ast(markdown)).not.toBe(ast(source));
    expect(isTextEditingSafe(source)).toBe(false);
  });

  it.each(['- 항목\n  > 인용', '- 항목\n  ```text\n  코드\n  ```', '- # 제목\n  본문'])(
    'blocks a tight list item that gains a paragraph wrapper: %s',
    async (source) => {
      const { html, markdown } = await roundTrip(source);
      const root = document.createElement('div');
      root.innerHTML = html;
      expect(root.querySelector('li > p')).toBeNull();
      root.innerHTML = (await renderMarkdown(markdown)).html;
      expect(root.querySelector('li > p')).not.toBeNull();
      expect(parser.parse(source)).toMatchObject({
        children: [{ type: 'list', children: [{ type: 'listItem', spread: false }] }],
      });
      expect(parser.parse(markdown)).toMatchObject({
        children: [{ type: 'list', children: [{ type: 'listItem', spread: true }] }],
      });
      expect(isTextEditingSafe(source)).toBe(false);
    },
  );

  it.each(['# 제목', '> 인용', '- 항목', '1. 번호'])(
    'does not mistake a table cell for a standalone block: %s',
    async (cell) => {
      const source = `| ${cell} | 값 |\n| --- | --- |\n| a | b |`;
      const { html, markdown } = await roundTrip(source);
      expect(ast(markdown)).toBe(ast(source));
      expect((await renderMarkdown(markdown)).html).toBe(html);
      expect(isTextEditingSafe(source)).toBe(true);
    },
  );
});

describe('HTML embed text editing round trip', () => {
  it.each([
    '{"src":"/assets/embeds/2026-10-06/gallery.html","title":"갤러리","height":640}',
    '{\n  "src": "/assets/embeds/2026-10-06/gallery.html",\n  "title": "그림 & <태그> `한글`",\n  "height": 640\n}',
    '{ "src": "https://example.com/invalid.html", "title": "코드 fallback" }',
    '{ "src": ',
  ])('JSON 원문과 주변 문단을 보존하며 C-02가 코드 내부를 오판하지 않는다: %s', async (json) => {
    const source = `앞 문단\n\n\`\`\`embed\n${json}\n\`\`\`\n\n뒤 문단`;
    const { html, markdown } = await roundTrip(source);
    expect(markdown).toBe(source);
    expect(ast(markdown)).toBe(ast(source));
    expect((await renderMarkdown(markdown, { assetPublicUrl: '' })).html).toBe(html);
    expect(isTextEditingSafe(source)).toBe(true);
  });

  it('임베드 옆 손실 위험 문단은 기존 C-02 가드로 차단한다', () => {
    const embed = '```embed\n{"src":"/assets/embeds/2026-10-06/a.html","title":"그림"}\n```';
    expect(isTextEditingSafe(`${embed}\n\n\\# 제목 아님`)).toBe(false);
  });
});
