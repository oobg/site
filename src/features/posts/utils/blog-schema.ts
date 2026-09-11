import { z } from 'zod';

export const categorySlugSchema = z
  .string()
  .trim()
  .min(1, '카테고리 slug를 입력해 주세요.')
  .max(80, '카테고리 slug는 80자 이하여야 합니다.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '카테고리 slug 형식이 올바르지 않습니다.');

export const blogCategoryInputSchema = z.object({
  slug: categorySlugSchema,
  name: z.string().trim().min(1).max(80),
  sort_order: z.coerce.number().int().min(0),
});

export const blogPostMetadataInputSchema = z.object({
  category_id: z.uuid(),
  tags: z
    .array(z.string().trim().min(1).max(80))
    .max(30)
    .default([])
    .transform((tags) => {
      const seen = new Set<string>();
      return tags
        .filter((tag) => {
          const key = tag.toLocaleLowerCase('ko-KR');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((tag) => tag.toLocaleLowerCase('ko-KR'));
    }),
  cover_image_key: z.string().trim().min(1).max(1024).nullable().default(null),
  cover_image_url: z
    .url()
    .refine((url) => url.startsWith('https://') || url.startsWith('http://'), {
      message: 'cover URL은 http(s) URL이어야 합니다.',
    })
    .nullable()
    .default(null),
  cover_position_x: z.coerce.number().min(0).max(1).default(0.5),
  cover_position_y: z.coerce.number().min(0).max(1).default(0.5),
  cover_alt: z.string().trim().min(1).max(300).nullable().default(null),
});

export const blogPostFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: categorySlugSchema.optional(),
  tag: z.string().trim().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
