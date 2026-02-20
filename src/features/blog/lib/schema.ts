import { z } from "zod";

const postCategorySchema = z.object({
  name: z.string(),
  color: z.string(),
}).nullable().optional();

export const postMetaSchema = z.object({
  published_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  category: postCategorySchema,
});

export const postItemSchema = z.object({
  id: z.coerce.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  meta: postMetaSchema,
});

const postItemResponseSchema = z.object({
  status: z.number(),
  data: postItemSchema,
  message: z.array(z.string()).optional().default([]),
});

const postsListDataSchema = z.object({
  items: z.array(postItemSchema),
  total: z.coerce.number(),
  next_cursor: z.string().nullable().optional().transform(v => v ?? ""),
});

const postsListResponseSchema = z.object({
  status: z.number(),
  data: postsListDataSchema,
  message: z.array(z.string()).optional().default([]),
});

export function parsePostItemResponse(json: unknown): z.infer<typeof postItemSchema> {
  const parsed = postItemResponseSchema.parse(json);
  return parsed.data;
}

export function parsePostsListResponse(
  json: unknown
): z.infer<typeof postsListDataSchema> {
  const result = postsListResponseSchema.safeParse(json);
  if (result.success) return result.data.data;
  if (import.meta.env.DEV) {
    console.error("[blog] list response parse error:", result.error.flatten());
    console.error("[blog] received:", JSON.stringify(json, null, 2).slice(0, 500));
  }
  throw result.error;
}

export type PostItem = z.infer<typeof postItemSchema>;
export type PostMeta = z.infer<typeof postMetaSchema>;
export type PostsListData = z.infer<typeof postsListDataSchema>;
