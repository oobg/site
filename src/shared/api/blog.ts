import { apiClient } from './client';
import type { BlogPost } from './mock/factories/blog';

// Notion API 타입 정의
export interface NotionPage {
  id: string;
  notionId: string;
  title: string | null;
  properties: Record<string, unknown>;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotionPages {
  data: NotionPage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BlogListResponse {
  data: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogDetailResponse {
  data: BlogPost;
}

// Notion properties에서 값을 추출하는 헬퍼 함수
function getPropertyValue(properties: Record<string, unknown>, key: string): unknown {
  const prop = properties[key];
  if (!prop || typeof prop !== 'object') return null;

  const propObj = prop as Record<string, unknown>;
  const { type } = propObj;

  if (type === 'title' && Array.isArray(propObj.title)) {
    const titleArray = propObj.title as Array<{ plain_text?: string }>;
    return titleArray.map((item) => item.plain_text || '').join('');
  }

  if (type === 'rich_text' && Array.isArray(propObj.rich_text)) {
    const richTextArray = propObj.rich_text as Array<{ plain_text?: string }>;
    return richTextArray.map((item) => item.plain_text || '').join('');
  }

  if (type === 'select' && propObj.select) {
    const select = propObj.select as { name?: string };
    return select.name || null;
  }

  if (type === 'status' && propObj.status) {
    const status = propObj.status as { name?: string };
    return status.name || null;
  }

  if (type === 'multi_select' && Array.isArray(propObj.multi_select)) {
    const multiSelect = propObj.multi_select as Array<{ name?: string }>;
    return multiSelect.map((item) => item.name || '').filter(Boolean);
  }

  if (type === 'number') {
    return propObj.number ?? null;
  }

  if (type === 'date' && propObj.date) {
    const date = propObj.date as { start?: string };
    return date.start || null;
  }

  return null;
}

// NotionPage를 BlogPost로 변환하는 함수
export function convertNotionPageToBlogPost(notionPage: NotionPage): BlogPost {
  const { properties } = notionPage;

  // 다양한 키 이름 시도 (한글/영문)
  const title = (getPropertyValue(properties, '제목') as string)
    || (getPropertyValue(properties, 'title') as string)
    || notionPage.title
    || '';

  const content = (getPropertyValue(properties, '내용') as string)
    || (getPropertyValue(properties, 'content') as string)
    || '';

  const excerpt = (getPropertyValue(properties, '요약') as string)
    || (getPropertyValue(properties, 'excerpt') as string)
    || '';

  const author = (getPropertyValue(properties, '작성자') as string)
    || (getPropertyValue(properties, 'author') as string)
    || '';

  const tags = (getPropertyValue(properties, '태그') as string[])
    || (getPropertyValue(properties, 'tags') as string[])
    || [];

  const readTime = (getPropertyValue(properties, '읽기시간') as number)
    || (getPropertyValue(properties, 'readTime') as number)
    || 0;

  return {
    id: notionPage.id,
    title,
    content,
    excerpt,
    author,
    createdAt: notionPage.createdAt,
    updatedAt: notionPage.updatedAt,
    tags: Array.isArray(tags) ? tags : [],
    readTime: typeof readTime === 'number' ? readTime : 0,
  };
}

export const blogApi = {
  getList: async (page = 1, limit = 20): Promise<BlogListResponse> => {
    const response = await apiClient.get('pages', { searchParams: { page, limit } }).json<PaginatedNotionPages>();
    return {
      data: response.data.map(convertNotionPageToBlogPost),
      pagination: {
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      },
    };
  },

  getDetail: async (title: string): Promise<BlogDetailResponse> => {
    const notionPage = await apiClient.get('page', { searchParams: { title } }).json<NotionPage>();
    return {
      data: convertNotionPageToBlogPost(notionPage),
    };
  },
};
