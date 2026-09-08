import 'server-only';
import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import { bundledLanguages, type BuiltinLanguage } from 'shiki';
import { isSpecialLang } from 'shiki/core';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { TocEntry } from '@lib/markdown/toc.types';
import { env } from '@configs/env';

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

/** 글에 실제로 쓰인 지원 언어 문법만 shiki에 초기화한다. */
function highlightCodeBlocks(this: Processor, langs: string[]) {
  return async (tree: Root) => {
    const supportedLangs = Array.from(
      new Set(
        langs.filter((lang): lang is BuiltinLanguage => Object.hasOwn(bundledLanguages, lang)),
      ),
    );
    if (supportedLangs.length === 0 && !langs.some(isSpecialLang)) return;

    const highlight = rehypeShiki.call(this, {
      theme: 'poimandres',
      langs: supportedLangs,
      colorReplacements: { '#1b1e28': 'var(--color-canvas-2)' },
    }) as (tree: Root) => Root | undefined | Promise<Root | undefined>;
    await highlight(tree);
  };
}

/** 아이콘 두 개를 함께 심고 상태에 따라 CSS가 하나만 보인다 — 누른 뒤 아이콘을
    바꾸려고 자바스크립트로 DOM을 새로 만들 이유가 없다. */
function icon(kind: 'idle' | 'done'): Element {
  const path =
    kind === 'idle'
      ? 'M9 9V6.5A1.5 1.5 0 0 1 10.5 5h7A1.5 1.5 0 0 1 19 6.5v7a1.5 1.5 0 0 1-1.5 1.5H15M6.5 9h7A1.5 1.5 0 0 1 15 10.5v7A1.5 1.5 0 0 1 13.5 19h-7A1.5 1.5 0 0 1 5 17.5v-7A1.5 1.5 0 0 1 6.5 9Z'
      : 'M5 12.5 10 17.5 19 7.5';
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      [kind === 'idle' ? 'data-copy-idle' : 'data-copy-done']: '',
      viewBox: '0 0 24 24',
      width: 16,
      height: 16,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
    },
    children: [{ type: 'element', tagName: 'path', properties: { d: path }, children: [] }],
  };
}

/**
 * 복사 버튼. 마크업만 서버에서 심고 동작은 CodeCopy가 위임으로 붙인다.
 * 본문이 raw HTML이라 여기에 React 컴포넌트를 넣을 수 없다.
 *
 * 상태 문구는 스크린리더용으로 따로 둔다. aria-label만 바꾸면 초점이 이미 버튼에
 * 있을 때 바뀐 이름이 다시 읽히지 않는다.
 */
function copyButton(): Element {
  return {
    type: 'element',
    tagName: 'button',
    properties: { type: 'button', 'data-code-copy': '' },
    children: [
      icon('idle'),
      icon('done'),
      {
        type: 'element',
        tagName: 'span',
        properties: { 'data-code-copy-status': '', 'aria-live': 'polite' },
        children: [{ type: 'text', value: '코드 복사' }],
      },
    ],
  };
}

/**
 * 콜아웃. GitHub 표기(`> [!NOTE]`)를 그대로 받는다.
 *
 * 없으면 인용문을 경고 용도로 전용하게 되고, 그러면 남의 말을 옮긴 것과 내가 주의를
 * 주는 것이 같은 모양이 된다. 표기법을 새로 만들지 않는 이유는 원고가 Obsidian에서
 * 오기 때문이다 — 거기서도 같은 문법이 콜아웃으로 보여야 한다.
 *
 * 라벨은 한글로 심어 화면에 남긴다. 아이콘만 두면 색을 구별 못 하는 사람에게 종류가
 * 사라지고, 표기(`[!NOTE]`)를 그대로 노출하면 그건 원고 문법이 새어 나온 것이다.
 */
const CALLOUTS: Record<string, string> = {
  NOTE: '참고',
  TIP: '팁',
  IMPORTANT: '중요',
  WARNING: '주의',
  CAUTION: '경고',
};

function calloutBlocks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'blockquote') return;

      // 첫 문단의 첫 텍스트에서만 표기를 찾는다. 본문 중간의 [!NOTE]는 글자다.
      const first = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'p',
      );
      const head = first?.children[0];
      if (!head || head.type !== 'text') return;

      const match = /^\[!([A-Z]+)\]\s*\n?/.exec(head.value);
      const kind = match && CALLOUTS[match[1]] ? match[1] : null;
      if (!match || !kind) return;

      // 표기를 걷어낸다. 남은 것이 없으면 그 문단째 버린다(제목만 있는 콜아웃).
      head.value = head.value.slice(match[0].length);
      if (head.value === '' && first!.children.length === 1) {
        node.children = node.children.filter((child) => child !== first);
      }

      node.properties = { ...node.properties, 'data-callout': kind.toLowerCase() };
      node.children.unshift({
        type: 'element',
        tagName: 'p',
        properties: { 'data-callout-label': '' },
        children: [{ type: 'text', value: CALLOUTS[kind] }],
      });
    });
  };
}

function resolveAssetPath(value: string, publicUrl: string): string | null {
  if (!value.startsWith('/assets/')) return null;

  const suffixAt = value.search(/[?#]/);
  const pathname = suffixAt === -1 ? value : value.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? '' : value.slice(suffixAt);

  try {
    const decoded = decodeURIComponent(pathname);
    const segments = decoded.split('/').slice(2);
    if (
      decoded.includes('\\') ||
      segments.length === 0 ||
      segments.some((segment) => segment === '' || segment === '.' || segment === '..')
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return `${publicUrl.replace(/\/+$/, '')}${pathname}${suffix}`;
}

/** CMS가 저장한 루트 기준 자산 경로만 R2 공개 URL로 연결한다. */
function resolveAssetPaths(publicUrl: string) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      for (const property of ['src', 'href'] as const) {
        const value = node.properties?.[property];
        if (typeof value !== 'string') continue;
        const resolved = resolveAssetPath(value, publicUrl);
        if (resolved) node.properties[property] = resolved;
      }
    });
  };
}

function removeUnsafeResourceUrls() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      for (const property of ['src', 'href'] as const) {
        const value = node.properties?.[property];
        if (typeof value !== 'string') continue;
        const compact = value.replace(/[\u0000-\u0020\u007f]+/g, '');
        const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
        const allowed =
          !scheme ||
          scheme === 'http' ||
          scheme === 'https' ||
          (property === 'href' && scheme === 'mailto');
        if (!allowed) delete node.properties[property];
      }
    });
  };
}

/**
 * 코드블럭을 창틀로 감싼다.
 *
 * macOS 창 버튼을 흉내 낸 점 세 개를 두었다가 뺐다. 창틀이 해야 할 일은 언어 라벨과
 * 복사 버튼이 이미 하고 있어서, 점에는 "코드처럼 보이게" 하는 것 말고 남는 역할이
 * 없었다. 정보를 나르지 않는 관습은 관습이라는 이유만으로는 자리를 못 얻는다.
 *
 * 클래스가 아니라 data 속성을 쓰는 이유는 이 HTML이 CSS 모듈 밖에서 만들어져
 * 클래스 이름이 해시되지 않기 때문이다.
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
            properties: { 'data-code-lang': '' },
            children: lang ? [{ type: 'text', value: lang }] : [],
          },
          copyButton(),
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

export async function renderMarkdown(
  md: string,
  options: { assetPublicUrl?: string } = {},
): Promise<{ html: string; toc: TocEntry[] }> {
  const toc: TocEntry[] = [];
  const langs: string[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(
      resolveAssetPaths,
      options.assetPublicUrl ??
        (env.ASSET_STORAGE_BACKEND === 'local' ? env.ASSET_PUBLIC_URL : env.R2_PUBLIC_URL),
    )
    .use(removeUnsafeResourceUrls)
    .use(rehypeSlug)
    .use(collectToc, toc)
    .use(collectCodeLangs, langs)
    .use(calloutBlocks)
    /* 어두운 화면이라 어두운 테마를 쓴다. shiki는 pre에 배경색을 인라인으로 박기
       때문에 CSS로는 덮을 수 없다 — colorReplacements로 테마의 면 색만 우리 토큰에
       넘겨 코드블럭이 페이지와 같은 계조에 앉게 한다. */
    .use(highlightCodeBlocks, langs)
    .use(frameCodeBlocks, langs)
    .use(rehypeStringify)
    .process(md);
  return { html: String(file), toc };
}
