import type { ContentDetail, ContentListItem } from '@lib/api/contract.types';

export type PostListItem = ContentListItem;
export type Post = ContentDetail;

export interface PostFrontmatter {
  date?: string;
  cover?: string;
}
