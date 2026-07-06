export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export interface Envelope<T> {
  data: T;
  meta: { requestId: string; serverTime: string; pagination?: Pagination };
}

export interface ApiErrorBody {
  error: { code: string; message: string };
  meta: unknown;
}

export interface ContentListItem {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  published_at: string;
  updated_at: string;
  cover_image_url: string | null;
  reading_time_min?: number;
  status: 'published';
}

export interface ContentDetail extends ContentListItem {
  body_markdown: string;
  frontmatter: Record<string, unknown>;
}

export interface ListParams {
  tag?: string;
  page?: number;
  limit?: number;
  sort?: '-published_at' | 'published_at' | '-updated_at' | 'updated_at' | 'title';
}
