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
import { z } from 'zod';
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
      if (parent.properties?.['data-mermaid-fallback-code'] !== undefined) return;
      const classes = node.properties?.className;
      const list = Array.isArray(classes) ? classes.map(String) : [];
      const found = list.find((name) => name.startsWith('language-'));
      langs.push(found ? found.slice('language-'.length) : '');
    });
  };
}

const INSTALLER_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;

const installerText = (maximum: number) => z.string().trim().min(1).max(maximum);
const installerCode = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .refine((value) => value.trim().length > 0);
const installerSchema = z
  .object({
    title: installerText(120),
    intro: installerText(600).optional(),
    managers: z
      .object({
        npm: installerCode(2_000).optional(),
        pnpm: installerCode(2_000).optional(),
        yarn: installerCode(2_000).optional(),
        bun: installerCode(2_000).optional(),
      })
      .strict()
      .refine((managers) => Object.values(managers).some(Boolean)),
    steps: z
      .array(
        z
          .object({
            title: installerText(120),
            description: installerText(1_000).optional(),
            code: installerCode(20_000).optional(),
            language: z
              .string()
              .trim()
              .regex(/^[a-z0-9][a-z0-9.+#_-]{0,31}$/i)
              .optional(),
            note: installerText(1_000).optional(),
            tip: installerText(1_000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict();

type Installer = z.infer<typeof installerSchema>;

function textElement(
  tagName: string,
  value: string,
  properties: Element['properties'] = {},
): Element {
  return {
    type: 'element',
    tagName,
    properties,
    children: [{ type: 'text', value }],
  };
}

function sourceStore(kind: 'mermaid' | 'installer', value: string): Element {
  return textElement('div', value, {
    [`data-${kind}-source`]: '',
    hidden: true,
    'aria-hidden': 'true',
  });
}

function installerCodeBlock(value: string, label: string, kind: 'command' | 'step'): Element {
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      [kind === 'command' ? 'data-installer-command' : 'data-installer-code']: '',
    },
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [textElement('code', value, label ? { className: [`language-${label}`] } : {})],
      },
    ],
  };
}

function installerView(installer: Installer, source: string, ordinal: number): Element {
  const managers = INSTALLER_MANAGERS.filter((manager) => installer.managers[manager]);
  const tabId = (manager: string) => `installer-${ordinal}-tab-${manager}`;
  const panelId = (manager: string) => `installer-${ordinal}-panel-${manager}`;

  return {
    type: 'element',
    tagName: 'section',
    properties: {
      'data-installer': '',
      'aria-labelledby': `installer-${ordinal}-title`,
      contentEditable: 'false',
    },
    children: [
      sourceStore('installer', source),
      textElement('h3', installer.title, {
        id: `installer-${ordinal}-title`,
        'data-installer-title': '',
      }),
      ...(installer.intro
        ? [textElement('p', installer.intro, { 'data-installer-intro': '' })]
        : []),
      {
        type: 'element',
        tagName: 'div',
        properties: { role: 'tablist', 'aria-label': '패키지 매니저', 'data-installer-tabs': '' },
        children: managers.map((manager, index) =>
          textElement('button', manager, {
            type: 'button',
            role: 'tab',
            id: tabId(manager),
            'aria-controls': panelId(manager),
            'aria-selected': index === 0 ? 'true' : 'false',
            tabIndex: index === 0 ? 0 : -1,
            'data-installer-manager': manager,
          }),
        ),
      },
      ...managers.map((manager, index) => ({
        type: 'element' as const,
        tagName: 'div',
        properties: {
          role: 'tabpanel',
          id: panelId(manager),
          'aria-labelledby': tabId(manager),
          'data-installer-panel': manager,
          hidden: index === 0 ? undefined : true,
        },
        children: [installerCodeBlock(installer.managers[manager]!, 'sh', 'command')],
      })),
      {
        type: 'element',
        tagName: 'ol',
        properties: { 'data-installer-steps': '' },
        children: installer.steps.map((step) => ({
          type: 'element',
          tagName: 'li',
          properties: {},
          children: [
            textElement('h4', step.title),
            ...(step.description ? [textElement('p', step.description)] : []),
            ...(step.code ? [installerCodeBlock(step.code, step.language ?? '', 'step')] : []),
            ...(step.note ? [textElement('p', step.note, { 'data-installer-note': '' })] : []),
            ...(step.tip ? [textElement('p', step.tip, { 'data-installer-tip': '' })] : []),
          ],
        })),
      },
    ],
  };
}

/** installer JSON is promoted only after strict schema validation; otherwise the pre is untouched. */
function installerBlocks() {
  return (tree: Root) => {
    let ordinal = 0;
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null || index === undefined) return;
      const code = node.children[0];
      if (!code || code.type !== 'element' || code.tagName !== 'code') return;
      const classes = Array.isArray(code.properties?.className)
        ? code.properties.className.map(String)
        : [];
      if (!classes.includes('language-installer')) return;

      const source = nodeText(code as unknown as TextishNode).replace(/\n$/, '');
      let parsed: unknown;
      try {
        parsed = JSON.parse(source);
      } catch {
        return;
      }
      const result = installerSchema.safeParse(parsed);
      if (!result.success) return;

      ordinal += 1;
      parent.children[index] = installerView(result.data, source, ordinal);
      return 'skip';
    });
  };
}

function mermaidBlocks() {
  return (tree: Root) => {
    let ordinal = 0;
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null || index === undefined) return;
      const code = node.children[0];
      if (!code || code.type !== 'element' || code.tagName !== 'code') return;
      const classes = Array.isArray(code.properties?.className)
        ? code.properties.className.map(String)
        : [];
      if (!classes.includes('language-mermaid')) return;

      const source = nodeText(code as unknown as TextishNode).replace(/\n$/, '');
      if (!source.trim()) return;
      ordinal += 1;
      parent.children[index] = {
        type: 'element',
        tagName: 'section',
        properties: {
          'data-mermaid': '',
          'data-mermaid-state': 'pending',
          contentEditable: 'false',
        },
        children: [
          sourceStore('mermaid', source),
          {
            type: 'element',
            tagName: 'div',
            properties: {
              'data-mermaid-canvas': '',
              role: 'img',
              'aria-label': `다이어그램 ${ordinal}`,
            },
            children: [],
          },
          {
            type: 'element',
            tagName: 'figure',
            properties: { 'data-mermaid-fallback': '', 'data-code': '', hidden: true },
            children: [
              appleWindowHeader('mermaid', true),
              {
                type: 'element',
                tagName: 'pre',
                properties: { 'data-mermaid-fallback-code': '' },
                children: [textElement('code', source, { className: ['language-mermaid'] })],
              },
            ],
          },
          textElement('p', '다이어그램을 불러오는 중이에요.', {
            'data-mermaid-status': '',
            role: 'status',
          }),
        ],
      };
      return 'skip';
    });
  };
}

const FILE_TREE_LANGS = new Set(['filetree', 'tree', 'folder']);
const AUTO_FILE_TREE_LANGS = new Set(['', 'text', 'text/plain']);

type FileTreeEntry = {
  name: string;
  kind: 'file' | 'folder';
  children: FileTreeEntry[];
};

type FileTreeIconKey =
  | 'folder'
  | 'react'
  | 'ts'
  | 'js'
  | 'md'
  | 'css'
  | 'json'
  | 'html'
  | 'svg'
  | 'image'
  | 'config'
  | 'file';

const CSS_FILE_EXTENSIONS = new Set([
  '.css',
  '.less',
  '.pcss',
  '.postcss',
  '.sass',
  '.scss',
  '.styl',
  '.stylus',
]);
const JSON_FILE_EXTENSIONS = new Set(['.json', '.json5', '.jsonc', '.jsonl', '.ndjson']);
const HTML_FILE_EXTENSIONS = new Set(['.astro', '.htm', '.html', '.shtml', '.xht', '.xhtml']);
const IMAGE_FILE_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.heif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
]);
const CONFIGURATION_FILE_EXTENSIONS = new Set([
  '.cfg',
  '.conf',
  '.config',
  '.env',
  '.hcl',
  '.ini',
  '.plist',
  '.properties',
  '.toml',
  '.xml',
  '.yaml',
  '.yml',
]);
const CONFIGURATION_FILE_NAMES = new Set([
  '.dockerignore',
  '.editorconfig',
  '.eslintignore',
  '.gitattributes',
  '.gitconfig',
  '.gitignore',
  '.gitmodules',
  '.npmignore',
  '.npmrc',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc',
  '.stylelintignore',
  '.stylelintrc',
  '.yarnrc',
  'dockerfile',
  'gemfile',
  'makefile',
  'procfile',
  'rakefile',
  'vagrantfile',
]);

function fileTreeIconKey(name: string, kind: FileTreeEntry['kind']): FileTreeIconKey {
  if (kind === 'folder') return 'folder';

  // Only the derived key is used in the URL. The literal entry name never becomes a path.
  const filename = name.endsWith('/') ? name.slice(0, -1) : name;
  const basename = filename.split('/').at(-1)?.toLowerCase() ?? '';
  if (
    CONFIGURATION_FILE_NAMES.has(basename) ||
    basename.startsWith('dockerfile.') ||
    /^\.env(?:[._-]|$)/.test(basename) ||
    /(?:^|[._-])(?:config|rc)(?:[._-]|$)/.test(basename)
  ) {
    return 'config';
  }

  const extensionAt = basename.lastIndexOf('.');
  const extension = extensionAt === -1 ? '' : basename.slice(extensionAt);
  if (extension === '.tsx' || extension === '.jsx') return 'react';
  if (extension === '.ts') return 'ts';
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return 'js';
  if (extension === '.md' || extension === '.mdx') return 'md';
  if (CSS_FILE_EXTENSIONS.has(extension)) return 'css';
  if (JSON_FILE_EXTENSIONS.has(extension)) return 'json';
  if (HTML_FILE_EXTENSIONS.has(extension)) return 'html';
  if (extension === '.svg' || extension === '.svgz') return 'svg';
  if (IMAGE_FILE_EXTENSIONS.has(extension)) return 'image';
  if (CONFIGURATION_FILE_EXTENSIONS.has(extension)) return 'config';
  return 'file';
}

function fileTreeIcon(entry: FileTreeEntry): Element {
  const key = fileTreeIconKey(entry.name, entry.kind);
  return {
    type: 'element',
    tagName: 'img',
    properties: {
      'data-filetree-icon': key,
      src: `/assets/filetree-icons/${key}.png`,
      alt: '',
      'aria-hidden': 'true',
    },
    children: [],
  };
}

/**
 * 터미널의 tree 출력처럼 생긴 코드펜스만 구조로 바꾼다.
 *
 * 들여쓰기는 `tree` 명령의 네 칸 단위(`│   ` 또는 공백 네 칸)만 받는다. 일부만
 * 해석해 잘못된 계층을 만들기보다, 빈 줄·깊이 점프·낯선 선 문자가 있으면 원래
 * 코드블럭으로 남기는 쪽이 안전하다.
 */
function parseFileTree(value: string, { requireBranch = false } = {}): FileTreeEntry[] | null {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  // fenced code가 만드는 마지막 개행 하나만 제거한다. 그 밖의 빈 줄은 입력 오류다.
  if (lines.at(-1) === '') lines.pop();
  if (lines.length === 0 || lines.some((line) => line.trim() === '')) return null;

  const branchPattern = /^((?:(?:│   )|(?: {4}))*)(?:├── |└── )(.+)$/;
  const firstBranch = branchPattern.exec(lines[0]);
  const hasNamedRoot = firstBranch === null;
  const roots: FileTreeEntry[] = [];
  const stack: FileTreeEntry[] = [];
  let hasBranch = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const branch = branchPattern.exec(line);
    let depth: number;
    let name: string;

    if (index === 0 && hasNamedRoot) {
      depth = 0;
      name = line.trim();
    } else if (branch) {
      hasBranch = true;
      depth = branch[1].length / 4 + (hasNamedRoot ? 1 : 0);
      name = branch[2].trim();
    } else {
      return null;
    }

    if (!name || depth > stack.length) return null;

    const entry: FileTreeEntry = {
      name,
      kind: name.endsWith('/') ? 'folder' : 'file',
      children: [],
    };

    if (depth === 0) {
      roots.push(entry);
    } else {
      const parent = stack[depth - 1];
      if (!parent) return null;
      if (parent.kind !== 'folder') return null;
      parent.children.push(entry);
    }

    stack.length = depth;
    stack[depth] = entry;
  }

  return roots.length > 0 && (!requireBranch || hasBranch) ? roots : null;
}

function fileTreeList(entries: FileTreeEntry[], root = false): Element {
  return {
    type: 'element',
    tagName: 'ul',
    properties: root ? { role: 'tree', 'aria-label': '파일 트리' } : { role: 'group' },
    children: entries.map((entry) => ({
      type: 'element',
      tagName: 'li',
      properties: {
        role: 'treeitem',
        'data-kind': entry.kind,
        'aria-label': `${entry.name}, ${entry.kind === 'folder' ? '폴더' : '파일'}`,
      },
      children: [
        fileTreeIcon(entry),
        {
          type: 'element',
          tagName: 'span',
          properties: { 'data-filetree-name': '' },
          children: [{ type: 'text', value: entry.name }],
        },
        ...(entry.children.length > 0 ? [fileTreeList(entry.children)] : []),
      ],
    })),
  };
}

/** 명시적 alias와 엄격히 파싱되는 일반 텍스트 트리를 shiki 전에 HAST로 바꾼다. */
function fileTreeBlocks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null || index === undefined) return;
      const code = node.children[0];
      if (!code || code.type !== 'element' || code.tagName !== 'code') return;
      const classes = Array.isArray(code.properties?.className)
        ? code.properties.className.map(String)
        : [];
      const languageClass = classes.find((name) => name.startsWith('language-'));
      const language = languageClass?.slice('language-'.length).toLowerCase() ?? '';
      if (!FILE_TREE_LANGS.has(language) && !AUTO_FILE_TREE_LANGS.has(language)) return;

      const entries = parseFileTree(nodeText(code as unknown as TextishNode), {
        requireBranch: AUTO_FILE_TREE_LANGS.has(language),
      });
      if (!entries) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { 'data-filetree': '' },
        children: [appleWindowHeader('파일 구조'), fileTreeList(entries, true)],
      };
      return 'skip';
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
      theme: 'github-light',
      langs: supportedLangs,
      colorReplacements: { '#fff': 'var(--color-canvas-2)' },
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

function windowDots(): Element {
  return {
    type: 'element',
    tagName: 'span',
    properties: { 'data-code-dots': '', 'aria-hidden': 'true' },
    children: [
      { type: 'element', tagName: 'i', properties: {}, children: [] },
      { type: 'element', tagName: 'i', properties: {}, children: [] },
      { type: 'element', tagName: 'i', properties: {}, children: [] },
    ],
  };
}

function appleWindowHeader(label: string, withCopyButton = false): Element {
  return {
    type: 'element',
    tagName: 'figcaption',
    properties: { 'data-code-head': '' },
    children: [
      windowDots(),
      {
        type: 'element',
        tagName: 'span',
        properties: { 'data-code-lang': '' },
        children: label ? [{ type: 'text', value: label }] : [],
      },
      ...(withCopyButton ? [copyButton()] : []),
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
 * macOS 코드 창의 익숙한 시각 문법을 제공하되 언어 라벨과 복사 기능은 그대로 둔다.
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
      if (node.properties?.['data-mermaid-fallback-code'] !== undefined) return;
      const lang = langs[at++] ?? '';
      if (
        parent.type === 'element' &&
        parent.tagName === 'figure' &&
        parent.properties?.['data-code'] !== undefined
      ) {
        return 'skip';
      }
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { 'data-code': '' },
        children: [appleWindowHeader(lang, true), node],
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
    .use(installerBlocks)
    .use(mermaidBlocks)
    .use(fileTreeBlocks)
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
