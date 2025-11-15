import type { NotionPage, NotionBlock } from '../../blog';

// 마크다운 문자열을 Notion 블록 배열로 변환하는 헬퍼 함수 (Mock 데이터용)
function markdownToNotionBlocks(markdown: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];
  let blockIdCounter = 0;

  // Mock용 기본 메타데이터 생성
  const createBlockMetadata = (type: string): Partial<NotionBlock> => {
    blockIdCounter += 1;
    const now = new Date().toISOString();
    return {
      id: `mock-block-${blockIdCounter}`,
      object: 'block',
      parent: { type: 'page_id', page_id: 'mock-page-id' },
      archived: false,
      in_trash: false,
      created_by: { id: 'mock-user-id', object: 'user' },
      created_time: now,
      has_children: false,
      last_edited_by: { id: 'mock-user-id', object: 'user' },
      last_edited_time: now,
      type,
    };
  };

  // Rich text 생성 헬퍼
  const createRichText = (text: string) => ({
    type: 'text',
    plain_text: text,
    text: { content: text, link: null },
    href: null,
    annotations: {
      bold: false,
      code: false,
      color: 'default',
      italic: false,
      underline: false,
      strikethrough: false,
    },
  });

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 코드 블록 시작/종료 처리
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // 코드 블록 종료
        blocks.push({
          ...createBlockMetadata('code'),
          code: {
            caption: [],
            language: codeBlockLanguage || undefined,
            rich_text: [createRichText(codeBlockContent.join('\n'))],
          },
        } as NotionBlock);
        codeBlockContent = [];
        codeBlockLanguage = '';
        inCodeBlock = false;
      } else {
        // 코드 블록 시작
        const languageMatch = trimmed.match(/^```(\w+)?/);
        codeBlockLanguage = languageMatch?.[1] || '';
        inCodeBlock = true;
      }
      i += 1;
    } else if (inCodeBlock) {
      // 코드 블록 내부 내용
      codeBlockContent.push(line);
      i += 1;
    } else if (trimmed.length === 0) {
      // 빈 줄은 건너뛰기
      i += 1;
    } else {
      // Heading 1
      if (trimmed.startsWith('# ')) {
        blocks.push({
          ...createBlockMetadata('heading_1'),
          heading_1: {
            color: 'default',
            rich_text: [createRichText(trimmed.substring(2))],
            is_toggleable: false,
          },
        } as NotionBlock);
      } else if (trimmed.startsWith('## ')) {
        // Heading 2
        blocks.push({
          ...createBlockMetadata('heading_2'),
          heading_2: {
            color: 'default',
            rich_text: [createRichText(trimmed.substring(3))],
            is_toggleable: false,
          },
        } as NotionBlock);
      } else if (trimmed.startsWith('### ')) {
        // Heading 3
        blocks.push({
          ...createBlockMetadata('heading_3'),
          heading_3: {
            color: 'default',
            rich_text: [createRichText(trimmed.substring(4))],
            is_toggleable: false,
          },
        } as NotionBlock);
      } else if (trimmed.startsWith('- ')) {
        // Bulleted list
        blocks.push({
          ...createBlockMetadata('bulleted_list_item'),
          bulleted_list_item: {
            color: 'default',
            rich_text: [createRichText(trimmed.substring(2))],
          },
        } as NotionBlock);
      } else if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list
        blocks.push({
          ...createBlockMetadata('numbered_list_item'),
          numbered_list_item: {
            color: 'default',
            rich_text: [createRichText(trimmed.replace(/^\d+\.\s/, ''))],
          },
        } as NotionBlock);
      } else if (trimmed.startsWith('> ')) {
        // Callout (blockquote 형식)
        blocks.push({
          ...createBlockMetadata('callout'),
          callout: {
            color: 'default',
            rich_text: [createRichText(trimmed.substring(2))],
            icon: '💡',
          },
        } as NotionBlock);
      } else {
        // Paragraph (기본)
        blocks.push({
          ...createBlockMetadata('paragraph'),
          paragraph: {
            color: 'default',
            rich_text: [createRichText(trimmed)],
          },
        } as NotionBlock);
      }
      i += 1;
    }
  }

  // 코드 블록이 닫히지 않은 경우 처리
  if (inCodeBlock && codeBlockContent.length > 0) {
    blocks.push({
      ...createBlockMetadata('code'),
      code: {
        caption: [],
        language: codeBlockLanguage || undefined,
        rich_text: [createRichText(codeBlockContent.join('\n'))],
      },
    } as NotionBlock);
  }

  return blocks;
}

// 블로그 목록용 타입 (간소화된 구조)
export interface BlogPostListItem {
  title: string;
  category: string;
  tags: string[];
  createdBy: string;
  created: string;
  edited: string;
}

// 블로그 상세용 타입 (새로운 구조)
export interface BlogPost {
  title: string;
  category: string;
  tags: string[];
  createdBy: string;
  created: string;
  edited: string;
  content: string; // 마크다운 문자열
}

// Notion API 응답 구조로 Mock 데이터 생성
function createNotionPage(
  id: string,
  notionId: string,
  title: string,
  content: string,
  excerpt: string,
  author: string,
  createdAt: string,
  updatedAt: string,
  tags: string[],
  readTime: number,
): NotionPage {
  return {
    id,
    notionId,
    title,
    properties: {
      제목: {
        type: 'title',
        title: [{ plain_text: title }],
      },
      내용: {
        type: 'rich_text',
        rich_text: [{ plain_text: content }],
      },
      요약: {
        type: 'rich_text',
        rich_text: [{ plain_text: excerpt }],
      },
      작성자: {
        type: 'rich_text',
        rich_text: [{ plain_text: author }],
      },
      태그: {
        type: 'multi_select',
        multi_select: tags.map((tag) => ({ name: tag })),
      },
      읽기시간: {
        type: 'number',
        number: readTime,
      },
      상태: {
        type: 'status',
        status: { name: '발행됨' },
      },
    },
    content: markdownToNotionBlocks(content), // 페이지 상세보기용 블록 배열
    syncedAt: updatedAt,
    createdAt,
    updatedAt,
  };
}

export const notionPages: NotionPage[] = [
  createNotionPage(
    '1',
    'notion-1',
    'React 19의 새로운 기능들',
    `
# React 19의 새로운 기능들

React 19가 출시되면서 많은 흥미로운 기능들이 추가되었습니다.

## 주요 변경사항

### 1. React Compiler
React Compiler가 공식적으로 지원되기 시작했습니다. 이는 개발자가 수동으로 useMemo나 useCallback을 사용할 필요 없이 자동으로 최적화를 수행합니다.

### 2. 서버 컴포넌트
서버 컴포넌트가 더욱 안정적으로 작동하며, 성능이 크게 개선되었습니다.

### 3. 새로운 Hooks
여러 새로운 훅들이 추가되어 개발자 경험이 향상되었습니다.

## 결론

React 19는 더 나은 성능과 개발자 경험을 제공합니다.
    `.trim(),
    'React 19의 새로운 기능들과 변경사항을 살펴봅니다.',
    'Raven',
    '2024-01-15T10:00:00Z',
    '2024-01-15T10:00:00Z',
    ['React', 'Frontend', 'JavaScript'],
    5,
  ),
  createNotionPage(
    '2',
    'notion-2',
    'TypeScript와 함께하는 타입 안전한 개발',
    `
# TypeScript와 함께하는 타입 안전한 개발

TypeScript는 JavaScript에 타입 시스템을 추가하여 더 안전하고 유지보수하기 쉬운 코드를 작성할 수 있게 해줍니다.

## 타입 안전성의 이점

1. **컴파일 타임 에러 발견**: 런타임 전에 오류를 발견할 수 있습니다.
2. **자동완성 향상**: IDE에서 더 나은 자동완성을 제공합니다.
3. **리팩토링 용이**: 타입 정보를 활용해 안전하게 리팩토링할 수 있습니다.

## 베스트 프랙티스

- 엄격한 타입 체크 활성화
- any 타입 사용 최소화
- 유니온 타입과 제네릭 적극 활용
    `.trim(),
    'TypeScript를 활용한 타입 안전한 개발 방법을 알아봅니다.',
    'Raven',
    '2024-01-20T14:30:00Z',
    '2024-01-20T14:30:00Z',
    ['TypeScript', 'Programming', 'Best Practices'],
    7,
  ),
  createNotionPage(
    '3',
    'notion-3',
    'FSD 아키텍처로 프로젝트 구조화하기',
    `
# FSD 아키텍처로 프로젝트 구조화하기

Feature-Sliced Design (FSD)는 확장 가능하고 유지보수하기 쉬운 프론트엔드 아키텍처입니다.

## FSD의 레이어

1. **app**: 애플리케이션 초기화
2. **pages**: 페이지 컴포넌트
3. **widgets**: 독립적인 UI 블록
4. **features**: 비즈니스 기능
5. **entities**: 비즈니스 엔티티
6. **shared**: 공유 리소스

## 장점

- 명확한 의존성 규칙
- 확장 가능한 구조
- 팀 협업에 유리
    `.trim(),
    'FSD 아키텍처를 활용한 프로젝트 구조화 방법을 소개합니다.',
    'Raven',
    '2024-01-25T09:15:00Z',
    '2024-01-25T09:15:00Z',
    ['Architecture', 'Frontend', 'FSD'],
    6,
  ),
];

// NotionPage를 BlogPostListItem으로 변환하는 함수
export function convertNotionPageToBlogPostListItem(page: NotionPage): BlogPostListItem {
  const props = page.properties;

  // properties에서 값 추출 (한글/영문 키 모두 시도)
  const getPropValue = (key: string, fallbackKey?: string): unknown => {
    const prop = (
      props[key] || (fallbackKey ? props[fallbackKey] : undefined)
    ) as { type?: string; [key: string]: unknown } | undefined;
    if (!prop) return null;

    if (prop.type === 'title' && Array.isArray(prop.title)) {
      const titleArray = prop.title as Array<{ plain_text?: string }>;
      return titleArray.map((item) => item.plain_text || '').join('');
    }

    if (prop.type === 'rich_text' && Array.isArray(prop.rich_text)) {
      const richTextArray = prop.rich_text as Array<{ plain_text?: string }>;
      return richTextArray.map((item) => item.plain_text || '').join('');
    }

    if (prop.type === 'select' && prop.select) {
      const select = prop.select as { name?: string };
      return select.name || null;
    }

    if (prop.type === 'multi_select' && Array.isArray(prop.multi_select)) {
      const multiSelect = prop.multi_select as Array<{ name?: string }>;
      return multiSelect.map((item) => item.name || '').filter(Boolean);
    }

    return null;
  };

  const title = (getPropValue('제목', 'title') as string) || page.title || '';
  const category = (getPropValue('카테고리', 'category') as string) || '';
  const tags = (getPropValue('태그', 'tags') as string[]) || [];
  const createdBy = (
    (getPropValue('작성자', 'createdBy') as string)
    || (getPropValue('author') as string)
    || ''
  );

  return {
    title,
    category,
    tags: Array.isArray(tags) ? tags : [],
    createdBy,
    created: page.createdAt,
    edited: page.updatedAt,
  };
}

// NotionPage를 BlogPost로 변환하는 함수 (상세보기용)
export function convertNotionPageToBlogPost(page: NotionPage): BlogPost {
  const props = page.properties;

  const getPropValue = (key: string, fallbackKey?: string): unknown => {
    const prop = (
      props[key] || (fallbackKey ? props[fallbackKey] : undefined)
    ) as { type?: string; [key: string]: unknown } | undefined;
    if (!prop) return null;

    if (prop.type === 'title' && Array.isArray(prop.title)) {
      const titleArray = prop.title as Array<{ plain_text?: string }>;
      return titleArray.map((item) => item.plain_text || '').join('');
    }

    if (prop.type === 'rich_text' && Array.isArray(prop.rich_text)) {
      const richTextArray = prop.rich_text as Array<{ plain_text?: string }>;
      return richTextArray.map((item) => item.plain_text || '').join('');
    }

    if (prop.type === 'select' && prop.select) {
      const select = prop.select as { name?: string };
      return select.name || null;
    }

    if (prop.type === 'multi_select' && Array.isArray(prop.multi_select)) {
      const multiSelect = prop.multi_select as Array<{ name?: string }>;
      return multiSelect.map((item) => item.name || '').filter(Boolean);
    }

    return null;
  };

  const title = (getPropValue('제목', 'title') as string) || page.title || '';
  const category = (getPropValue('카테고리', 'category') as string) || '';
  const tags = (getPropValue('태그', 'tags') as string[]) || [];
  const createdBy = (
    (getPropValue('작성자', 'createdBy') as string)
    || (getPropValue('author') as string)
    || ''
  );

  // content는 마크다운 문자열로 반환
  // NotionPage의 content는 NotionBlock[]이지만, 원본 마크다운은 properties에서 가져옴
  const contentMarkdown = (getPropValue('내용', 'content') as string) || '';

  return {
    title,
    category,
    tags: Array.isArray(tags) ? tags : [],
    createdBy,
    created: page.createdAt,
    edited: page.updatedAt,
    content: contentMarkdown,
  };
}
