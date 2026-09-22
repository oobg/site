import type { ContentDetail, ContentListItem } from '@lib/api/contract.types';

export type PostListItem = ContentListItem & { category?: Pick<BlogCategory, 'slug'> };
export type Post = ContentDetail;

export const DEFAULT_POST_CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
export const DEFAULT_POST_CATEGORY_SLUG = '미분류';

export interface BlogCategory {
  id: string;
  slug: string;
  /** 이전 URL에서만 사용하는 값. 새 링크는 항상 slug를 사용한다. */
  legacy_slug?: string | null;
  name: string;
  sort_order: number;
  is_default: boolean;
}

export interface BlogCategoryWithCount extends BlogCategory {
  post_count: number;
}

export interface BlogPostSummary extends ContentListItem {
  category: BlogCategory;
  cover_image_key: string | null;
  cover_position: {
    x: number;
    y: number;
  };
  cover_alt: string | null;
  pin_order: number | null;
}

export type BlogPostSelectionCandidate = Omit<BlogPostSummary, 'status'> & {
  status: 'draft' | 'published';
};

export interface BlogPost extends ContentDetail {
  category: BlogCategory;
  cover_image_key: string | null;
  cover_position: {
    x: number;
    y: number;
  };
  cover_alt: string | null;
  pin_order: number | null;
}

export interface BlogPostFilters {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBlogPosts {
  items: BlogPostSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface BlogHomeData {
  featured: BlogPostSummary[];
  archive: PaginatedBlogPosts;
  categories: BlogCategoryWithCount[];
  sections: BlogHomeSection[];
}

export interface BlogHomeSection {
  category: BlogCategoryWithCount;
  posts: BlogPostSummary[];
}

export interface PostFrontmatter {
  date?: string;
  cover?: string;
}
