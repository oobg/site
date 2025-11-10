import { NotionRenderer } from 'react-notion-x';
import type { ExtendedRecordMap, BlockType } from 'notion-types';
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

// NotionBlock[]을 react-notion-x의 recordMap 형식으로 변환
function convertBlocksToRecordMap(blocks: NotionBlock[]): ExtendedRecordMap {
  const recordMap: ExtendedRecordMap = {
    block: {},
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {},
  };

  blocks.forEach((block, index) => {
    const blockId = `block-${index}`;
    const blockType = mapNotionBlockTypeToBlockType(block.type);

    // 각 블록 타입에 맞는 properties 생성
    // react-notion-x는 properties를 any로 받으므로 유연하게 처리
    let properties: unknown = {};

    if (blockType === 'paragraph' && block.paragraph?.rich_text) {
      properties = {
        title: block.paragraph.rich_text.map((text) => [text.plain_text || '']),
      };
    } else if (blockType === 'heading_1' && block.heading_1?.rich_text) {
      properties = {
        title: block.heading_1.rich_text.map((text) => [text.plain_text || '']),
      };
    } else if (blockType === 'heading_2' && block.heading_2?.rich_text) {
      properties = {
        title: block.heading_2.rich_text.map((text) => [text.plain_text || '']),
      };
    } else if (blockType === 'heading_3' && block.heading_3?.rich_text) {
      properties = {
        title: block.heading_3.rich_text.map((text) => [text.plain_text || '']),
      };
    } else if (blockType === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      properties = {
        title: block.bulleted_list_item.rich_text.map((text) => [text.plain_text || '']),
      };
    } else if (blockType === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
      properties = {
        title: block.numbered_list_item.rich_text.map((text) => [text.plain_text || '']),
      };
    }

    recordMap.block[blockId] = {
      role: 'reader',
      value: {
        id: blockId,
        type: blockType,
        properties,
        format: {},
        content: [],
        parent_table: 'block',
        parent_id: index > 0 ? `block-${index - 1}` : '',
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

  return recordMap;
}

interface NotionRendererProps {
  content: NotionBlock[];
}

export const NotionContentRenderer = ({ content }: NotionRendererProps) => {
  if (!content || content.length === 0) {
    return <div className="text-gray-400">콘텐츠가 없습니다.</div>;
  }

  const recordMap = convertBlocksToRecordMap(content);

  return (
    <div className="notion-container">
      <NotionRenderer
        recordMap={recordMap}
        fullPage={false}
        darkMode
        previewImages={false}
        mapPageUrl={(pageId) => `/blog/${pageId}`}
      />
    </div>
  );
};
