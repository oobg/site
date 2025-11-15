import type { NotionBlock, NotionRichText } from '@src/shared/api/blog';

// rich_text 배열에서 텍스트 추출 (text.content와 plain_text 모두 지원)
function extractTextFromRichText(richText: NotionRichText[]): string {
  if (!richText || richText.length === 0) {
    return '';
  }
  return richText
    .map((text) => text.text?.content || text.plain_text || '')
    .join('');
}

// NotionBlock[]을 마크다운 문자열로 변환
export function notionToMarkdown(blocks: NotionBlock[]): string {
  if (!blocks || blocks.length === 0) {
    return '';
  }

  const markdownLines: string[] = [];
  let listContext: { type: 'bulleted' | 'numbered'; level: number } | null = null;

  blocks.forEach((block) => {
    switch (block.type) {
      case 'paragraph': {
        const text = extractTextFromRichText(block.paragraph?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(text);
          markdownLines.push(''); // 빈 줄 추가
        }
        listContext = null; // 리스트 컨텍스트 종료
        break;
      }

      case 'heading_1': {
        const text = extractTextFromRichText(block.heading_1?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`# ${text}`);
          markdownLines.push('');
        }
        listContext = null;
        break;
      }

      case 'heading_2': {
        const text = extractTextFromRichText(block.heading_2?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`## ${text}`);
          markdownLines.push('');
        }
        listContext = null;
        break;
      }

      case 'heading_3': {
        const text = extractTextFromRichText(block.heading_3?.rich_text || []);
        if (text.trim()) {
          markdownLines.push(`### ${text}`);
          markdownLines.push('');
        }
        listContext = null;
        break;
      }

      case 'bulleted_list_item': {
        const text = extractTextFromRichText(block.bulleted_list_item?.rich_text || []);
        if (text.trim()) {
          if (listContext?.type !== 'bulleted') {
            // 새로운 불릿 리스트 시작
            listContext = { type: 'bulleted', level: 0 };
          }
          markdownLines.push(`- ${text}`);
        }
        break;
      }

      case 'numbered_list_item': {
        const text = extractTextFromRichText(block.numbered_list_item?.rich_text || []);
        if (text.trim()) {
          if (listContext?.type !== 'numbered') {
            // 새로운 번호 리스트 시작
            listContext = { type: 'numbered', level: 0 };
            markdownLines.push(`1. ${text}`);
          } else {
            // 기존 번호 리스트 계속
            const currentNumber = markdownLines.filter((line) => line.match(/^\d+\./)).length + 1;
            markdownLines.push(`${currentNumber}. ${text}`);
          }
        }
        break;
      }

      case 'code': {
        const text = extractTextFromRichText(block.code?.rich_text || []);
        const language = block.code?.language || '';
        if (text.trim()) {
          markdownLines.push(`\`\`\`${language}`);
          markdownLines.push(text);
          markdownLines.push('```');
          markdownLines.push('');
        }
        listContext = null;
        break;
      }

      case 'callout': {
        const text = extractTextFromRichText(block.callout?.rich_text || []);
        const icon = block.callout?.icon || '💡';
        if (text.trim()) {
          // Callout을 blockquote로 변환
          markdownLines.push(`> ${icon} ${text}`);
          markdownLines.push('');
        }
        listContext = null;
        break;
      }

      default:
        // 알 수 없는 블록 타입은 무시
        listContext = null;
        break;
    }
  });

  // 마지막에 빈 줄 제거
  while (markdownLines.length > 0 && markdownLines[markdownLines.length - 1] === '') {
    markdownLines.pop();
  }

  return markdownLines.join('\n');
}
