import { afterEach, describe, expect, it, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { renderMarkdown } from '@lib/markdown/render';
import { htmlToMarkdown } from '@features/admin/utils/htmlToMarkdown';
import { isTextEditingSafe } from '@features/admin/utils/textEditingSafety';

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
