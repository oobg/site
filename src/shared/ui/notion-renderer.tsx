import { NotionRenderer } from 'react-notion-x';
import type { ExtendedRecordMap, BlockType, Decoration } from 'notion-types';
import 'react-notion-x/src/styles.css';
import type { NotionBlock } from '@shared/api/blog';

// NotionBlock 타입을 react-notion-x의 BlockType으로 매핑
function mapNotionBlockTypeToBlockType(notionType: string): BlockType {
  const typeMap: Record<string, BlockType> = {
    paragraph: 'text',
    heading_1: 'header',
    heading_2: 'sub_header',
    heading_3: 'sub_sub_header',
    bulleted_list_item: 'bulleted_list',
    numbered_list_item: 'numbered_list',
  };

  const mapped = typeMap[notionType];
  if (mapped) {
    return mapped;
  }
  // BlockType은 string을 포함하므로 타입 단언이 안전함
  return notionType as BlockType;
}

// rich_text를 Decoration[] 형식으로 변환
function convertRichTextToDecorations(
  richText: Array<{ plain_text?: string; [key: string]: unknown }>,
): Decoration[] {
  return richText.map((text) => [text.plain_text || ''] as Decoration);
}

// NotionBlock[]을 react-notion-x의 recordMap 형식으로 변환
function convertBlocksToRecordMap(blocks: NotionBlock[]): {
  recordMap: ExtendedRecordMap;
  rootPageId: string;
} {
  const recordMap: ExtendedRecordMap = {
    block: {},
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {},
  };

  if (blocks.length === 0) {
    return { recordMap, rootPageId: '' };
  }

  const blockIds: string[] = [];

  // 모든 블록 생성
  blocks.forEach((block, index) => {
    const blockId = `block-${index}`;
    blockIds.push(blockId);
    const blockType = mapNotionBlockTypeToBlockType(block.type);

    // 각 블록 타입에 맞는 properties 생성 (Decoration[] 형식)
    let properties: { title: Decoration[] } = { title: [] };

    if (block.type === 'paragraph' && block.paragraph?.rich_text) {
      properties = {
        title: convertRichTextToDecorations(block.paragraph.rich_text),
      };
    } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
      properties = {
        title: convertRichTextToDecorations(block.heading_1.rich_text),
      };
    } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
      properties = {
        title: convertRichTextToDecorations(block.heading_2.rich_text),
      };
    } else if (block.type === 'heading_3' && block.heading_3?.rich_text) {
      properties = {
        title: convertRichTextToDecorations(block.heading_3.rich_text),
      };
    } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      properties = {
        title: convertRichTextToDecorations(block.bulleted_list_item.rich_text),
      };
    } else if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
      properties = {
        title: convertRichTextToDecorations(block.numbered_list_item.rich_text),
      };
    }

    // 첫 번째 블록은 루트로 설정, 나머지는 첫 번째 블록의 자식으로 설정
    const isRoot = index === 0;
    const parentId = isRoot ? '' : blockIds[0];

    recordMap.block[blockId] = {
      role: 'reader',
      value: {
        id: blockId,
        type: blockType,
        properties,
        format: {},
        content: [],
        parent_table: 'block',
        parent_id: parentId,
        version: 1,
        created_time: Date.now(),
        last_edited_time: Date.now(),
        alive: true,
        created_by_table: 'notion_user',
        created_by_id: '',
        last_edited_by_table: 'notion_user',
        last_edited_by_id: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, // react-notion-x의 Block 타입이 복잡하므로 any로 처리
    };
  });

  // 첫 번째 블록의 content에 나머지 블록들을 추가
  if (blockIds.length > 1) {
    const rootBlock = recordMap.block[blockIds[0]];
    if (rootBlock) {
      rootBlock.value.content = blockIds.slice(1);
    }
  }

  return { recordMap, rootPageId: blockIds[0] };
}

interface NotionRendererProps {
  content: NotionBlock[];
}

export const NotionContentRenderer = ({ content }: NotionRendererProps) => {
  if (!content || content.length === 0) {
    return <div className="text-gray-400">콘텐츠가 없습니다.</div>;
  }

  const { recordMap, rootPageId } = convertBlocksToRecordMap(content);

  if (!rootPageId) {
    return <div className="text-gray-400">콘텐츠를 렌더링할 수 없습니다.</div>;
  }

  // 디버깅용 콘솔 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Notion recordMap:', recordMap);
    // eslint-disable-next-line no-console
    console.log('Root page ID:', rootPageId);
  }

  return (
    <div className="notion-container">
      <NotionRenderer
        recordMap={recordMap}
        rootPageId={rootPageId}
        fullPage={false}
        darkMode
        previewImages={false}
        mapPageUrl={(pageId) => `/blog/${pageId}`}
      />
    </div>
  );
};
