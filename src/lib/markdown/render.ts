import 'server-only';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { TocEntry } from '@lib/markdown/toc.types';

// 구조적 타입으로 텍스트만 추출(hast 세부 타입 마찰 회피)
type TextishNode = { type: string; value?: string; children?: TextishNode[] };
function nodeText(node: TextishNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map((child) => nodeText(child)).join('');
}

function collectToc(toc: TocEntry[]) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const depth = node.tagName === 'h2' ? 2 : node.tagName === 'h3' ? 3 : 0;
      if (depth === 0) return;
      const id = node.properties?.id;
      if (typeof id !== 'string') return;
      toc.push({
        id,
        text: nodeText(node as unknown as TextishNode).trim(),
        depth: depth as 2 | 3,
      });
    });
  };
}

/**
 * 코드블럭의 언어를 shiki가 지나가기 전에 받아 둔다.
 *
 * shiki는 pre 노드를 통째로 새로 만들어 돌려주므로 원래 code에 붙어 있던
 * language-* 클래스가 사라진다. 나중에 헤더에 표시할 언어를 여기서 순서대로 모은다.
 */
function collectCodeLangs(langs: string[]) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, _index, parent) => {
      if (node.tagName !== 'code') return;
      if (!parent || parent.type !== 'element' || parent.tagName !== 'pre') return;
      const classes = node.properties?.className;
      const list = Array.isArray(classes) ? classes.map(String) : [];
      const found = list.find((name) => name.startsWith('language-'));
      langs.push(found ? found.slice('language-'.length) : '');
    });
  };
}

/**
 * 코드블럭을 창틀로 감싼다.
 *
 * 점 세 개는 관습이고, 정보를 나르는 것은 오른쪽 언어 라벨이다. 장식만 남기지
 * 않으려고 둘을 같은 줄에 둔다. 클래스가 아니라 data 속성을 쓰는 이유는 이 HTML이
 * CSS 모듈 밖에서 만들어져 클래스 이름이 해시되지 않기 때문이다.
 */
function frameCodeBlocks(langs: string[]) {
  return (tree: Root) => {
    let at = 0;
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre') return;
      if (!parent || index === null || index === undefined) return;
      const lang = langs[at++] ?? '';
      const head: Element = {
        type: 'element',
        tagName: 'figcaption',
        properties: { 'data-code-head': '' },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { 'data-code-dots': '', 'aria-hidden': 'true' },
            children: [1, 2, 3].map(() => ({
              type: 'element' as const,
              tagName: 'i',
              properties: {},
              children: [],
            })),
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { 'data-code-lang': '' },
            children: lang ? [{ type: 'text', value: lang }] : [],
          },
        ],
      };
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { 'data-code': '' },
        children: [head, node],
      };
      return 'skip';
    });
  };
}

export async function renderMarkdown(md: string): Promise<{ html: string; toc: TocEntry[] }> {
  const toc: TocEntry[] = [];
  const langs: string[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(collectToc, toc)
    .use(collectCodeLangs, langs)
    /* 어두운 화면이라 어두운 테마를 쓴다. shiki는 pre에 배경색을 인라인으로 박기
       때문에 CSS로는 덮을 수 없다 — colorReplacements로 테마의 면 색만 우리 토큰에
       넘겨 코드블럭이 페이지와 같은 계조에 앉게 한다. */
    .use(rehypeShiki, {
      theme: 'poimandres',
      colorReplacements: { '#1b1e28': 'var(--color-canvas-2)' },
    })
    .use(frameCodeBlocks, langs)
    .use(rehypeStringify)
    .process(md);
  return { html: String(file), toc };
}
