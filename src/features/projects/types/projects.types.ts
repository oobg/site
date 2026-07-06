import type { ContentDetail, ContentListItem } from '@lib/api/contract.types';

export type ProjectListItem = ContentListItem;
export type Project = ContentDetail;

export interface ProjectFrontmatter {
  role?: string;
  period?: string;
  stack?: string[];
  links?: { repo?: string; live?: string };
}
