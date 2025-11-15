import { apiClient } from './client';
import type { BlogPost, BlogPostListItem } from './mock/factories/blog';

// Notion 블록 타입 정의
export interface NotionBlock {
  type: string;
  paragraph?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
  };
  heading_1?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
  };
  heading_2?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
  };
  heading_3?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
  };
  bulleted_list_item?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
  };
  numbered_list_item?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
  };
  code?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
    language?: string;
  };
  callout?: {
    rich_text: Array<{ plain_text?: string; [key: string]: unknown }>;
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

export interface BlogDetailResponse {
  data: BlogPost;
}

export const blogApi = {
  getList: async (page = 1, limit = 20): Promise<BlogListResponse> => {
    const response = await apiClient.get('pages', { searchParams: { page, limit } }).json<BlogListResponse>();
    return response;
  },

  getDetail: async (title: string): Promise<BlogDetailResponse> => {
    const response = await apiClient.get('page', { searchParams: { title } }).json<BlogDetailResponse>();
    return response;
  },
};
