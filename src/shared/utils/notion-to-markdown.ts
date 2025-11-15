import type { NotionBlock } from '@src/shared/api/blog';

// Notion 블록 배열을 마크다운 문자열로 변환
// API에서 받은 블록 데이터만 사용 (NotionClient 불필요)
export async function convertNotionBlocksToMarkdown(blocks: NotionBlock[]): Promise<string> {
  // notion-to-md는 NotionClient가 필요하지만, 백엔드에서 이미 모든 블록 데이터를 제공하므로
  // 더미 클라이언트 없이 직접 변환 로직 사용
  // 또는 notion-to-md의 내부 변환 로직을 활용

  // notion-to-md 없이 직접 변환 (API에서 받은 블록 데이터만 사용)
  const markdownLines: string[] = [];

  const extractRichText = (
    richText: Array<{ plain_text?: string; text?: { content?: string } }>,
  ): string => {
    if (!richText || richText.length === 0) return '';
    return richText
      .map((rt) => rt.text?.content || rt.plain_text || '')
      .join('');
  };

  blocks.forEach((block) => {
    switch (block.type) {
      case 'paragraph': {
        const text = extractRichText(block.paragraph?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(text);
          markdownLines.push('');
        }
        break;
      }
      case 'heading_1': {
        const text = extractRichText(block.heading_1?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`# ${text}`);
          markdownLines.push('');
        }
        break;
      }
      case 'heading_2': {
        const text = extractRichText(block.heading_2?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`## ${text}`);
          markdownLines.push('');
        }
        break;
      }
      case 'heading_3': {
        const text = extractRichText(block.heading_3?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`### ${text}`);
          markdownLines.push('');
        }
        break;
      }
      case 'bulleted_list_item': {
        const text = extractRichText(block.bulleted_list_item?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`- ${text}`);
        }
        break;
      }
      case 'numbered_list_item': {
        const text = extractRichText(block.numbered_list_item?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`1. ${text}`);
        }
        break;
      }
      case 'code': {
        const code = extractRichText(block.code?.rich_text || []);
        const lang = block.code?.language || '';
        if (code.trim()) {
          markdownLines.push(`\`\`\`${lang}`);
          markdownLines.push(code);
          markdownLines.push('```');
          markdownLines.push('');
        }
        break;
      }
      case 'callout': {
        const text = extractRichText(block.callout?.rich_text || []);
        const icon = block.callout?.icon || '💡';
        if (text.trim()) {
          markdownLines.push(`> ${icon} ${text}`);
          markdownLines.push('');
        }
        break;
      }
      default:
        // 알 수 없는 블록 타입은 무시
        break;
    }
  });

  // 마지막에 빈 줄 제거
  while (markdownLines.length > 0 && markdownLines[markdownLines.length - 1] === '') {
    markdownLines.pop();
  }

  return markdownLines.join('\n');
}
