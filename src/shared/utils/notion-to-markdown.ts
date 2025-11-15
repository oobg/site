import { NotionToMarkdown } from 'notion-to-md';
import { Client } from '@notionhq/client';
import type { NotionBlock } from '@src/shared/api/blog';

// Notion 블록 배열을 마크다운 문자열로 변환
export async function convertNotionBlocksToMarkdown(blocks: NotionBlock[]): Promise<string> {
  // notion-to-md는 NotionClient가 필요함 (blocksToMarkdown 내부에서 사용)
  // 더미 클라이언트로 초기화 (실제로는 블록 배열만 변환하므로 사용되지 않을 수 있음)
  const notionClient = new Client({
    auth: 'dummy', // 실제로 사용하지 않으므로 더미 값
  });

  const n2m = new NotionToMarkdown({
    notionClient,
  });

  try {
    // blocksToMarkdown을 사용하여 Notion 블록 배열을 마크다운 블록으로 변환
    // blocks는 Notion API의 ListBlockChildrenResponseResults 형태여야 함
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mdBlocks = await n2m.blocksToMarkdown(blocks as any);

    // toMarkdownString을 사용하여 마크다운 문자열로 변환
    // 반환값은 객체 형태 { parent: string, ... } 이므로 parent를 사용
    const mdStringObject = n2m.toMarkdownString(mdBlocks);
    return mdStringObject.parent || mdStringObject[Object.keys(mdStringObject)[0]] || '';
  } catch (error) {
    // 에러 발생 시 폴백 로직 사용
    // 폴백: 간단한 텍스트 추출
    return blocks
      .map((block) => {
        if (block.paragraph?.rich_text) {
          return block.paragraph.rich_text.map((rt) => rt.plain_text || rt.text?.content || '').join('');
        }
        if (block.heading_1?.rich_text) {
          return `# ${block.heading_1.rich_text.map((rt) => rt.plain_text || rt.text?.content || '').join('')}`;
        }
        if (block.heading_2?.rich_text) {
          return `## ${block.heading_2.rich_text.map((rt) => rt.plain_text || rt.text?.content || '').join('')}`;
        }
        if (block.heading_3?.rich_text) {
          return `### ${block.heading_3.rich_text.map((rt) => rt.plain_text || rt.text?.content || '').join('')}`;
        }
        if (block.code?.rich_text) {
          const code = block.code.rich_text.map((rt) => rt.plain_text || rt.text?.content || '').join('');
          const lang = block.code.language || '';
          return `\`\`\`${lang}\n${code}\n\`\`\``;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
}
