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
  id: string;
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
  createNotionPage(
    '4',
    'notion-4',
    '합성 컴포넌트 패턴으로 Dialog 구현하기',
    `
React 프로젝트에서 빠질 수 없는 UI가 바로 Dialog(모달)다.
처음엔 페이지별로 모달을 따로 구현했지만, 점점 상태 관리와 디자인 일관성이 깨졌다. 그래서 이번엔 디자인 시스템 차원에서 합성 컴포넌트 패턴을 적용해 Dialog를 다시 만들었다.

---

### 왜 합성 컴포넌트인가?

처음에는 \`Dialog\` 하나 안에 모든 UI를 다 넣고 props로 제어했다.

\`hasFooter\`, \`variant="alert"\` 같은 옵션을 계속 늘려가다 보니 코드가 점점 지저분해졌다.

하지만 실제로 쓰다 보면 모달마다 구조가 제각각이다.

- 어떤 건 헤더/본문/푸터가 모두 필요
- 어떤 건 본문만 있는 단순 알림창
- 또 어떤 건 특수한 버튼이 들어가야 함

즉, **상황에 맞게 유연하게 조합할 수 있는 구조**가 필요했다.

그래서 최종적으로 \`<Dialog>\`를 부모 요소로 두고,

그 안에 \`<Dialog.Content>\`, \`<Dialog.Trigger>\` 같은 서브 컴포넌트를 붙여 쓰는 **합성 컴포넌트 패턴**을 도입했다.

---

### 출저

사실 합성 컴포넌트의 개념을 도입하고자 마음먹은 것은, tailwind labs 가 운영하고 있는 사이트, headlessUI 에서 가져왔다.

[https://headlessui.com/](https://headlessui.com/)

---

### 합성 구조 설계

Dialog의 entry point를 하나 두고, 내부에 필요한 서브 컴포넌트를 붙였다.

\`\`\`typescript
import DialogTrigger from "./Trigger";
import DialogTriggerIcon from "./TriggerIcon";
import DialogOverlay from "./Overlay";
import DialogCloseButton from "./CloseButton";
import DialogContent from "./Content";
import DialogDim from "./Dim";

export const Dialog = Object.assign(DialogOverlay, {
  Trigger: Object.assign(DialogTrigger, {
    Icon: DialogTriggerIcon,
  }),
  Close: DialogCloseButton,
  Content: DialogContent,
  Dim: DialogDim,
});
\`\`\`

이렇게 하면 사용하는 쪽에서 이런 식으로 쓸 수 있다:

\`\`\`typescript
<Dialog.Trigger>
  <Dialog.Trigger.Icon />
</Dialog.Trigger>

<Dialog>
  <Dialog.Dim />
  <Dialog.Close />
  <Dialog.Content />
</Dialog>
\`\`\`

---

### Zustand로 상태 관리하기

Dialog의 열림/닫힘 상태는 여전히 Zustand로 관리한다.

단순히 모달만 띄울 때는 \`isOpen\`, \`open\`, \`close\` 세 가지만 있으면 충분하다.

\`\`\`typescript
// store/dialogStore.ts
import { create } from "zustand";

interface DialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
\`\`\`

---

### 실제 사용 예시

\`\`\`typescript
import { Dialog } from "@src/shared";
import { useDialogStore } from "../store/dialogStore";

export default function Page() {
  const { open } = useDialogStore();

  return (
    <div>
      <Dialog.Trigger>
        <Dialog.Trigger.Icon />
      </Dialog.Trigger>

      <Dialog>
        <Dialog.Dim />
        <Dialog.Close />
        <Dialog.Content>
          <h2 className="text-lg font-bold">Dialog Title</h2>
          <p className="mt-2 text-gray-600">여기에 내용을 넣습니다.</p>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}
\`\`\`

---

### 심화과정

큰 틀에서의 합성 컴포넌트로 구현한 Dialog 컴포넌트는 어느정도 완성이 되었다.

이제 조금씩 기능을 덧붙여보도록 하자.

---

### 단점

이렇게 showModal 메서드를 호출하여 모달을 불러오는 방식은 다음과 같은 한계를 갖게 된다.

Notification 안내 모달이 showModal 뒤로 들어간다.

---

### 작업하면서 느낀 점

- \`Object.assign\`으로 합성 컴포넌트를 묶으니, **API 사용성이 직관적**이었다.
- \`Dialog.Trigger.Icon\` 같은 깊은 네이밍도 가능해서, 디자인 시스템에서 **조립식으로 쓸 수 있는 형태**가 됐다.
- \`props\`로 모든 걸 제어하는 방식보다 훨씬 유연했고, 필요 없는 부분은 빼고 쓰면 되니 가볍다.
- 다만 접근성(esc 키, focus trap)과 애니메이션은 별도의 레이어로 다루는 게 좋겠다.

---

👉 이번 구조는 디자인 시스템에서 **확장성과 직관적 API**를 모두 챙길 수 있었다.

다음 단계는 **접근성 보강**과 **애니메이션 적용 경험**을 정리할 예정이다.
    `.trim(),
    '합성 컴포넌트 패턴을 활용한 Dialog 컴포넌트 구현 경험을 공유합니다.',
    'Raven',
    '2024-02-01T11:00:00Z',
    '2024-02-01T11:00:00Z',
    ['React', 'Component', 'Design System'],
    10,
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
    id: page.id,
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
