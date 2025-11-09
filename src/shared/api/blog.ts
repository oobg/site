import { apiClient } from './client';
import type { BlogPost } from './mock/factories/blog';

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

export const blogApi = {
  getList: async (page = 1, limit = 10): Promise<BlogListResponse> => apiClient.get('blog', { searchParams: { page, limit } }).json(),

  getDetail: async (id: string): Promise<BlogDetailResponse> => apiClient.get(`blog/${id}`).json(),
};
