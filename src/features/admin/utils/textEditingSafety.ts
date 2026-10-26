import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const parser = unified().use(remarkParse).use(remarkGfm);
type MarkdownNode = { type: string; children?: MarkdownNode[]; [key: string]: unknown };
const properties: Record<string, readonly string[]> = {
  root: ['children'],
  paragraph: ['children'],
  heading: ['depth', 'children'],
  blockquote: ['children'],
  list: ['ordered', 'start', 'spread', 'children'],
  listItem: ['spread', 'checked', 'children'],
  thematicBreak: [],
  text: ['value'],
  emphasis: ['children'],
  strong: ['children'],
  delete: ['children'],
  break: [],
  inlineCode: ['value'],
  code: ['lang', 'meta', 'value'],
  link: ['url', 'title', 'children'],
  image: ['url', 'title', 'alt'],
  table: ['align', 'children'],
  tableRow: ['children'],
  tableCell: ['children'],
};

// These are exactly the text characters protected by htmlToMarkdown, not a scan of the source.
function escapeText(value: string) {
  return Array.from(value, (character) =>
    '\\`*_[]'.includes(character) ? `\\${character}` : character === '\u00a0' ? ' ' : character,
  ).join('');
}

function inline(node: MarkdownNode): string {
  const children = () => node.children!.map(inline).join('');
  switch (node.type) {
    case 'text':
      return escapeText(node.value as string);
    case 'break':
      return '  \n';
    case 'strong':
      return `**${children()}**`;
    case 'emphasis':
      return `*${children()}*`;
    case 'delete':
      return `~~${children()}~~`;
    case 'inlineCode': {
      const value = node.value as string;
      let longest = 0;
      let run = 0;
      for (const character of value) {
        run = character === '`' ? run + 1 : 0;
        longest = Math.max(longest, run);
      }
      const fence = '`'.repeat(longest + 1);
      const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : '';
      return `${fence}${padding}${value}${padding}${fence}`;
    }
    case 'link':
      return `[${children()}](<${node.url}>)`;
    case 'image': {
      const alt = Array.from((node.alt as string | null) ?? '', (character) =>
        '\\[]'.includes(character) ? `\\${character}` : character,
      ).join('');
      return `![${alt}](<${node.url}>)`;
    }
    default:
      throw new Error('Unsupported inline node');
  }
}

function withoutPositions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutPositions);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'position')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, withoutPositions(child)]),
  );
}

function inlineStructureSurvives(children: MarkdownNode[], depth?: number) {
  if (!children.length) return true;
  const serialized = children.map(inline).join('');
  const block =
    depth === undefined ? { type: 'paragraph', children } : { type: 'heading', depth, children };
  const expected = { type: 'root', children: [block] };
  const markdown = depth === undefined ? serialized : `${'#'.repeat(depth)} ${serialized.trim()}`;
  // Decoded text such as "# text", "> text", or a multiline setext marker must remain a paragraph.
  // Comparing the inline AST also detects unprotected GFM markers becoming new inline structure.
  return (
    JSON.stringify(withoutPositions(parser.parse(markdown))) ===
    JSON.stringify(withoutPositions(expected))
  );
}

function supported(node: MarkdownNode): boolean {
  const allowed = properties[node.type];
  if (
    !allowed ||
    Object.keys(node).some((key) => key !== 'type' && key !== 'position' && !allowed.includes(key))
  )
    return false;
  if (
    allowed.includes('children') &&
    (!Array.isArray(node.children) || !node.children.every(supported))
  )
    return false;
  if (node.children) {
    // The converter emits nested lists after all other list-item blocks.
    // It also normalizes markers, merging adjacent lists of the same kind.
    let nestedListSeen = false;
    for (const [index, child] of node.children.entries()) {
      if (node.type === 'listItem') {
        if (child.type === 'list') nestedListSeen = true;
        else if (nestedListSeen) return false;
      }
      const previous = node.children[index - 1];
      if (child.type === 'list' && previous?.type === 'list' && child.ordered === previous.ordered)
        return false;
    }
  }
  if ((node.type === 'list' || node.type === 'listItem') && node.spread === true) return false;
  if (allowed.includes('value') && typeof node.value !== 'string') return false;
  if (
    node.type === 'heading' &&
    (!Number.isInteger(node.depth) || Number(node.depth) < 1 || Number(node.depth) > 6)
  )
    return false;
  if (
    node.type === 'code' &&
    (node.meta != null || (node.lang != null && typeof node.lang !== 'string'))
  )
    return false;
  if (
    node.type === 'list' &&
    (typeof node.ordered !== 'boolean' ||
      typeof node.spread !== 'boolean' ||
      (node.start != null && (!Number.isInteger(node.start) || Number(node.start) < 0)))
  )
    return false;
  if (
    node.type === 'listItem' &&
    (typeof node.spread !== 'boolean' ||
      (node.checked != null && typeof node.checked !== 'boolean'))
  )
    return false;
  if (
    node.type === 'table' &&
    (!Array.isArray(node.align) || node.align.some((align) => align !== null))
  )
    return false;
  if (node.type === 'link' || node.type === 'image') {
    if (
      node.title != null ||
      typeof node.url !== 'string' ||
      !node.url ||
      node.url !== node.url.trim() ||
      node.url.includes('<') ||
      node.url.includes('>')
    )
      return false;
    const protocol = new URL(node.url, 'https://markdown.invalid').protocol;
    if (!['https:', 'http:', ...(node.type === 'link' ? ['mailto:'] : [])].includes(protocol))
      return false;
    if (node.type === 'image' && node.alt != null && typeof node.alt !== 'string') return false;
  }
  if (node.type === 'heading') return inlineStructureSurvives(node.children!, Number(node.depth));
  if (['paragraph', 'tableCell'].includes(node.type))
    return inlineStructureSurvives(node.children!);
  return true;
}

/** Conservative entry guard. Unknown or lossy structures stay in the Markdown editor. */
export function isTextEditingSafe(markdown: string): boolean {
  try {
    return supported(parser.parse(markdown) as MarkdownNode);
  } catch {
    return false;
  }
}
