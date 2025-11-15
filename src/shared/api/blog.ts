import { apiClient } from './client';
import type { BlogPost, BlogPostListItem } from './mock/factories/blog';

// Notion Rich Text 타입 정의
export interface NotionRichText {
  type: string;
  plain_text: string;
  text?: {
    content: string;
    link?: string | null;
  };
  href?: string | null;
  annotations?: {
    bold?: boolean;
    code?: boolean;
    color?: string;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  };
  [key: string]: unknown;
}

// Notion 블록 타입 정의 (실제 API 구조 반영)
export interface NotionBlock {
  id: string;
  type: string;
  object: 'block';
  parent: {
    type: string;
    page_id?: string;
    [key: string]: unknown;
  };
  archived: boolean;
  in_trash: boolean;
  created_by: {
    id: string;
    object: 'user';
  };
  created_time: string;
  has_children: boolean;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  paragraph?: {
    color?: string;
    rich_text: NotionRichText[];
  };
  heading_1?: {
    color?: string;
    rich_text: NotionRichText[];
    is_toggleable?: boolean;
  };
  heading_2?: {
    color?: string;
    rich_text: NotionRichText[];
    is_toggleable?: boolean;
  };
  heading_3?: {
    color?: string;
    rich_text: NotionRichText[];
    is_toggleable?: boolean;
  };
  bulleted_list_item?: {
    color?: string;
    rich_text: NotionRichText[];
  };
  numbered_list_item?: {
    color?: string;
    rich_text: NotionRichText[];
  };
  code?: {
    caption?: unknown[];
    language?: string;
    rich_text: NotionRichText[];
  };
  callout?: {
    color?: string;
    rich_text: NotionRichText[];
    icon?: string;
  };
  [key: string]: unknown;
}

// Notion API 타입 정의
export interface NotionPage {
  id: string;
  notionId: string;
  title: string | null;
  properties: Record<string, unknown>;
  content?: NotionBlock[]; // 페이지 상세보기에서만 제공되는 블록 배열
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
  data: BlogPostListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type BlogDetailResponse = BlogPost;

export interface CategoryItem {
  name: string;
  count: number;
}

export type CategoryResponse = CategoryItem[];

export const blogApi = {
  getList: async (page = 1, limit = 20, category?: string): Promise<BlogListResponse> => {
    const searchParams: Record<string, string | number> = { page, limit };
    if (category) {
      searchParams.category = category;
    }
    const response = await apiClient.get('pages', { searchParams }).json<BlogListResponse>();
    return response;
  },

  getDetail: async (title: string): Promise<BlogDetailResponse> => {
    const response = await apiClient.get('page', { searchParams: { title } }).json<BlogDetailResponse>();
    return response;
  },

  getCategories: async (): Promise<CategoryResponse> => {
    const response = await apiClient.get('category').json<CategoryResponse>();
    return response;
  },
};
