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
    code: 'code',
    callout: 'callout',
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
  if (!richText || richText.length === 0) {
    return [[''] as Decoration]; // 빈 배열 대신 빈 문자열 Decoration 반환
  }
  const decorations = richText
    .map((text) => text.plain_text || '')
    .filter((text) => text.length > 0)
    .map((text) => [text] as Decoration);
  return decorations.length > 0 ? decorations : [[''] as Decoration];
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

  // 가상의 page 블록을 루트로 생성
  const rootPageId = 'root-page';
  const blockIds: string[] = [];
  const now = Date.now();
  const defaultUserId = 'default-user';

  // 가상의 page 블록 생성
  recordMap.block[rootPageId] = {
    role: 'reader',
    value: {
      id: rootPageId,
      type: 'page',
      properties: {
        title: [],
      },
      format: {
        page_full_width: false,
      },
      content: [],
      parent_table: 'block',
      parent_id: rootPageId, // 자기 자신을 parent로 설정 (루트 블록)
      version: 1,
      created_time: now,
      last_edited_time: now,
      alive: true,
      created_by_table: 'notion_user',
      created_by_id: defaultUserId,
      last_edited_by_table: 'notion_user',
      last_edited_by_id: defaultUserId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };

  // 모든 실제 블록 생성
  blocks.forEach((block, index) => {
    const blockId = `block-${index}`;
    blockIds.push(blockId);
    const blockType = mapNotionBlockTypeToBlockType(block.type);

    // 각 블록 타입에 맞는 properties 생성 (Decoration[] 형식)
    let properties: { title: Decoration[]; language?: Decoration[]; caption?: Decoration[] } = {
      title: [[''] as Decoration], // 기본값: 빈 문자열
    };
    let format: Record<string, unknown> = {};

    if (block.type === 'paragraph' && block.paragraph?.rich_text) {
      const decorations = convertRichTextToDecorations(block.paragraph.rich_text);
      if (decorations.length > 0) {
        properties = { title: decorations };
      }
    } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
      const decorations = convertRichTextToDecorations(block.heading_1.rich_text);
      if (decorations.length > 0) {
        properties = { title: decorations };
      }
    } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
      const decorations = convertRichTextToDecorations(block.heading_2.rich_text);
      if (decorations.length > 0) {
        properties = { title: decorations };
      }
    } else if (block.type === 'heading_3' && block.heading_3?.rich_text) {
      const decorations = convertRichTextToDecorations(block.heading_3.rich_text);
      if (decorations.length > 0) {
        properties = { title: decorations };
      }
    } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      const decorations = convertRichTextToDecorations(block.bulleted_list_item.rich_text);
      if (decorations.length > 0) {
        properties = { title: decorations };
      }
    } else if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
      const decorations = convertRichTextToDecorations(block.numbered_list_item.rich_text);
      if (decorations.length > 0) {
        properties = { title: decorations };
      }
    } else if (block.type === 'code' && block.code) {
      const language = block.code.language || 'plain text';
      const decorations = convertRichTextToDecorations(block.code.rich_text || []);
      properties = {
        title: decorations.length > 0 ? decorations : [[''] as Decoration],
        language: [[language] as Decoration] as Decoration[],
        caption: [],
      };
    } else if (block.type === 'callout' && block.callout) {
      const decorations = convertRichTextToDecorations(block.callout.rich_text || []);
      properties = {
        title: decorations.length > 0 ? decorations : [[''] as Decoration],
      };
      format = {
        page_icon: block.callout.icon || '💡',
        block_color: 'gray_background',
      };
    }

    // 모든 블록을 가상의 page 블록의 자식으로 설정
    const blockTime = Date.now();
    recordMap.block[blockId] = {
      role: 'reader',
      value: {
        id: blockId,
        type: blockType,
        properties,
        format: Object.keys(format).length > 0 ? format : {},
        content: [],
        parent_table: 'block',
        parent_id: rootPageId,
        version: 1,
        created_time: blockTime,
        last_edited_time: blockTime,
        alive: true,
        created_by_table: 'notion_user',
        created_by_id: defaultUserId,
        last_edited_by_table: 'notion_user',
        last_edited_by_id: defaultUserId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, // react-notion-x의 Block 타입이 복잡하므로 any로 처리
    };
  });

  // 가상의 page 블록의 content에 모든 실제 블록을 추가
  const rootBlock = recordMap.block[rootPageId];
  if (rootBlock) {
    rootBlock.value.content = blockIds;
  }

  return { recordMap, rootPageId };
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
    console.log('Notion recordMap:', JSON.stringify(recordMap, null, 2));
    // eslint-disable-next-line no-console
    console.log('Root page ID:', rootPageId);
    // eslint-disable-next-line no-console
    console.log('Block count:', Object.keys(recordMap.block).length);
    // eslint-disable-next-line no-console
    console.log('Root block content:', recordMap.block[rootPageId]?.value?.content);
  }

  // recordMap 검증
  const rootBlock = recordMap.block[rootPageId];
  if (!rootBlock || !rootBlock.value) {
    return <div className="text-gray-400">루트 블록을 찾을 수 없습니다.</div>;
  }

  if (!rootBlock.value.content || rootBlock.value.content.length === 0) {
    return <div className="text-gray-400">렌더링할 콘텐츠가 없습니다.</div>;
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
