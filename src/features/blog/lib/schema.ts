import { z } from "zod";

const postCategorySchema = z.object({
  name: z.string(),
  color: z.string(),
});

export const postMetaSchema = z.object({
  published_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  category: postCategorySchema,
});

export const postItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  meta: postMetaSchema,
});

const postItemResponseSchema = z.object({
  status: z.number(),
  data: postItemSchema,
  message: z.array(z.string()),
});

const postsListDataSchema = z.object({
  items: z.array(postItemSchema),
  total: z.number(),
  next_cursor: z.string(),
});

const postsListResponseSchema = z.object({
  status: z.number(),
  data: postsListDataSchema,
  message: z.array(z.string()),
});

export function parsePostItemResponse(json: unknown): z.infer<typeof postItemSchema> {
  const parsed = postItemResponseSchema.parse(json);
  return parsed.data;
}

export function parsePostsListResponse(
  json: unknown
): z.infer<typeof postsListDataSchema> {
  const parsed = postsListResponseSchema.parse(json);
  return parsed.data;
}

export type PostItem = z.infer<typeof postItemSchema>;
export type PostMeta = z.infer<typeof postMetaSchema>;
export type PostsListData = z.infer<typeof postsListDataSchema>;
