const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DIV',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'UL',
]);

const ignoredElement = (element: Element) =>
  element.matches(
    'button[data-code-copy], [data-code-copy-status], [data-code-head], [data-code-dots], [data-filetree-icon], [data-callout-label]',
  );

const safeUrl = (value: string, image = false) => {
  const trimmed = value.trim();
  const compact = trimmed.replace(/[\u0000-\u0020\u007f]+/g, '');
  if (!compact) return '';
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  const allowed =
    !scheme || scheme === 'http' || scheme === 'https' || (!image && scheme === 'mailto');
  if (!allowed) return '';
  return trimmed;
};

const destination = (value: string) =>
  /[\s()]/.test(value) ? `<${value.replaceAll('<', '%3C').replaceAll('>', '%3E')}>` : value;

const escapeText = (value: string) =>
  value.replace(/\u00a0/g, ' ').replace(/([\\`*_[\]])/g, '\\$1');

const escapeLabel = (value: string) => value.replace(/([\\[\]])/g, '\\$1');

function inlineCode(value: string) {
  const longest = Math.max(0, ...Array.from(value.matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(longest + 1);
  const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${value}${padding}${fence}`;
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent ?? '');
  if (!(node instanceof Element) || ignoredElement(node)) return '';

  const content = () => Array.from(node.childNodes, inline).join('');
  switch (node.tagName) {
    case 'BR':
      return '\n';
    case 'STRONG':
    case 'B':
      return `**${content()}**`;
    case 'EM':
    case 'I':
      return `*${content()}*`;
    case 'DEL':
    case 'S':
      return `~~${content()}~~`;
    case 'CODE':
      return inlineCode(node.textContent ?? '');
    case 'A': {
      const label = content();
      const href = safeUrl(node.getAttribute('href') ?? '');
      return href ? `[${label}](${destination(href)})` : label;
    }
    case 'IMG': {
      const alt = escapeLabel(node.getAttribute('alt') ?? '');
      const src = safeUrl(node.getAttribute('src') ?? '', true);
      return src ? `![${alt}](${destination(src)})` : alt;
    }
    case 'INPUT':
      return node.getAttribute('type') === 'checkbox'
        ? `${(node as HTMLInputElement).checked ? '[x]' : '[ ]'} `
        : '';
    default:
      return content();
  }
}

function codeBlock(element: Element) {
  const code = element.matches('pre')
    ? element.querySelector('code')
    : element.querySelector('pre code');
  const languageLabel = element.querySelector('[data-code-lang]')?.textContent?.trim() ?? '';
  const classLanguage = code?.className.match(/(?:^|\s)language-([^\s]+)/)?.[1] ?? '';
  const language = languageLabel || classLanguage;
  const value = (code?.textContent ?? element.textContent ?? '').replace(/\n$/, '');
  const longest = Math.max(0, ...Array.from(value.matchAll(/`{3,}/g), (match) => match[0].length));
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}${language}\n${value}\n${fence}`;
}

type FileTreeEntry = {
  name: string;
  kind: 'file' | 'folder';
  children: FileTreeEntry[];
};

function fileTreeEntryName(element: Element) {
  const nameElement = Array.from(element.children).find((child) =>
    child.matches('[data-filetree-name]'),
  );
  const raw = (
    nameElement?.textContent ??
    Array.from(element.childNodes)
      .filter((node) => !(node instanceof Element && node.tagName === 'UL'))
      .map((node) => node.textContent ?? '')
      .join('')
  ).replace(/\r\n?/g, '\n');
  // filetree는 인라인 Markdown을 해석하지 않으므로 이름은 HTML이 아닌 코드펜스의
  // 리터럴로 남긴다. 여러 줄 이름과 제어 문자만 한 줄 트리 표현에 맞게 정리한다.
  const name = raw
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
  if (!name) return '';
  const kind = element.getAttribute('data-kind') === 'folder' ? 'folder' : 'file';
  if (kind === 'folder') return name.endsWith('/') ? name : `${name}/`;
  return name.endsWith('/') ? name.slice(0, -1) : name;
}

function fileTreeEntries(list: Element): FileTreeEntry[] {
  return Array.from(list.children)
    .filter((child) => child.tagName === 'LI')
    .map((element) => {
      const nestedList = Array.from(element.children).find((child) => child.tagName === 'UL');
      const kind: FileTreeEntry['kind'] =
        element.getAttribute('data-kind') === 'folder' ? 'folder' : 'file';
      return {
        name: fileTreeEntryName(element),
        kind,
        children: nestedList ? fileTreeEntries(nestedList) : [],
      };
    })
    .filter((entry) => entry.name);
}

function fileTreeLines(entries: FileTreeEntry[], ancestorPrefix: string): string[] {
  return entries.flatMap((entry, index) => {
    const last = index === entries.length - 1;
    const branch = `${ancestorPrefix}${last ? '└── ' : '├── '}${entry.name}`;
    const childPrefix = `${ancestorPrefix}${last ? '    ' : '│   '}`;
    return [branch, ...fileTreeLines(entry.children, childPrefix)];
  });
}

function fileTree(element: Element) {
  const rootList = Array.from(element.children).find((child) => child.tagName === 'UL');
  if (!rootList) return '';
  const entries = fileTreeEntries(rootList);
  if (!entries.length) return '';

  // renderer가 허용하는 문법은 첫 항목을 이름 있는 root로 표현한다. 비정상적으로
  // root가 여러 개여도 나머지는 형제 branch로 남겨 텍스트를 버리지 않는다.
  const lines = [entries[0].name, ...fileTreeLines(entries[0].children, '')];
  if (entries.length > 1) lines.push(...fileTreeLines(entries.slice(1), ''));
  const longestBacktick = Math.max(
    0,
    ...Array.from(lines.join('\n').matchAll(/`+/g), (match) => match[0].length),
  );
  const fence = '`'.repeat(Math.max(3, longestBacktick + 1));
  return `${fence}filetree\n${lines.join('\n')}\n${fence}`;
}

function table(element: Element) {
  const rows = Array.from(element.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll(':scope > th, :scope > td')).map((cell) =>
      Array.from(cell.childNodes, inline)
        .join('')
        .trim()
        .replaceAll('|', '\\|')
        .replace(/\s*\n\s*/g, ' '),
    ),
  );
  if (!rows.length) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const line = (row: string[]) =>
    `| ${Array.from({ length: width }, (_, index) => row[index] ?? '').join(' | ')} |`;
  return [
    line(rows[0]),
    line(Array.from({ length: width }, () => '---')),
    ...rows.slice(1).map(line),
  ].join('\n');
}

function listItem(element: Element, ordered: boolean, index: number) {
  const nested = Array.from(element.children).filter((child) =>
    child.matches(':scope > ul, :scope > ol'),
  );
  const bodyNodes = Array.from(element.childNodes).filter(
    (node) => !(node instanceof Element && (node.tagName === 'UL' || node.tagName === 'OL')),
  );
  const body = blocks(bodyNodes).trim() || '';
  const marker = ordered ? `${index + 1}. ` : '- ';
  const lines = body.split('\n');
  const own = `${marker}${lines[0] ?? ''}${lines
    .slice(1)
    .map((line) => `\n  ${line}`)
    .join('')}`;
  const children = nested
    .map((child) =>
      block(child)
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n'),
    )
    .join('\n');
  return children ? `${own}\n${children}` : own;
}

function block(element: Element): string {
  if (ignoredElement(element)) return '';
  const tag = element.tagName;

  if (/^H[1-6]$/.test(tag)) {
    return `${'#'.repeat(Number(tag.slice(1)))} ${Array.from(element.childNodes, inline).join('').trim()}`;
  }
  if (tag === 'P') return Array.from(element.childNodes, inline).join('').trim();
  if (tag === 'HR') return '---';
  if (tag === 'FIGURE' && element.hasAttribute('data-filetree')) return fileTree(element);
  if (tag === 'FIGURE' && element.hasAttribute('data-code')) return codeBlock(element);
  if (tag === 'PRE') return codeBlock(element);
  if (tag === 'BLOCKQUOTE') {
    const kind = element.getAttribute('data-callout')?.toUpperCase();
    const children = Array.from(element.childNodes).filter(
      (node) => !(node instanceof Element && node.hasAttribute('data-callout-label')),
    );
    const value = blocks(children).trim();
    const quoted = value
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n');
    return kind ? `> [!${kind}]${quoted ? `\n${quoted}` : ''}` : quoted;
  }
  if (tag === 'UL' || tag === 'OL') {
    const ordered = tag === 'OL';
    return Array.from(element.children)
      .filter((child) => child.tagName === 'LI')
      .map((item, index) => listItem(item, ordered, index))
      .join('\n');
  }
  if (tag === 'TABLE') return table(element);

  return blocks(Array.from(element.childNodes));
}

function blocks(nodes: Node[]) {
  const result: string[] = [];
  let inlineBuffer = '';
  const flush = () => {
    const value = inlineBuffer.trim();
    if (value) result.push(value);
    inlineBuffer = '';
  };

  for (const node of nodes) {
    if (node instanceof Element && BLOCK_TAGS.has(node.tagName)) {
      flush();
      const value = block(node).trim();
      if (value) result.push(value);
    } else {
      inlineBuffer += inline(node);
    }
  }
  flush();
  return result.join('\n\n');
}

/** 렌더링된 글 DOM을 저장 계약인 Markdown 원문으로 보수적으로 되돌린다. */
export function htmlToMarkdown(root: ParentNode) {
  return blocks(Array.from(root.childNodes))
    .replace(/[ \t]+$/gm, '')
    .trim();
}
