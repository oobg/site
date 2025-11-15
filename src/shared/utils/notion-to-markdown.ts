import { NotionToMarkdown } from 'notion-to-md';
import { Client } from '@notionhq/client';
import type { NotionBlock } from '@src/shared/api/blog';

// Notion 블록 배열을 마크다운 문자열로 변환
// notion-to-md의 toMarkdownString 기능 활용
export async function convertNotionBlocksToMarkdown(blocks: NotionBlock[]): Promise<string> {
  // notion-to-md는 NotionClient가 필요하지만, 백엔드에서 이미 모든 블록 데이터를 제공하므로
  // 더미 클라이언트 사용 (has_children이 false이거나 이미 모든 자식 블록이 포함된 경우)
  const notionClient = new Client({
    auth: 'dummy', // blocksToMarkdown 내부에서 has_children 처리 시 필요하지만 실제로는 사용되지 않음
  });

  const n2m = new NotionToMarkdown({
    notionClient,
  });

  try {
    // blocksToMarkdown을 사용하여 Notion 블록 배열을 마크다운 블록으로 변환
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
          return block.paragraph.rich_text
            .map((rt) => rt.text?.content || rt.plain_text || '')
            .join('');
        }
        if (block.heading_1?.rich_text) {
          return `# ${block.heading_1.rich_text
            .map((rt) => rt.text?.content || rt.plain_text || '')
            .join('')}`;
        }
        if (block.heading_2?.rich_text) {
          return `## ${block.heading_2.rich_text
            .map((rt) => rt.text?.content || rt.plain_text || '')
            .join('')}`;
        }
        if (block.heading_3?.rich_text) {
          return `### ${block.heading_3.rich_text
            .map((rt) => rt.text?.content || rt.plain_text || '')
            .join('')}`;
        }
        if (block.code?.rich_text) {
          const code = block.code.rich_text
            .map((rt) => rt.text?.content || rt.plain_text || '')
            .join('');
          const lang = block.code.language || '';
          return `\`\`\`${lang}\n${code}\n\`\`\``;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
}
