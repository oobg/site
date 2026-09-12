import { z } from 'zod';

import { postInputSchema } from '@features/admin/services/posts.schema';
import { DEFAULT_POST_CATEGORY_ID } from '@features/posts/types/posts.types';
import { blogPostMetadataInputSchema } from '@features/posts/utils/blog-schema';
import { isAssetKey } from '@lib/assets/key';

export const MAX_POST_REQUEST_BYTES = 1_000_000;
export const MAX_POST_MARKDOWN_LENGTH = 200_000;
export const adminPostSlugSchema = postInputSchema.shape.slug;

const coordinate = z.number().min(0).max(1);

export const adminPostInputSchema = z
  .object({
    title: postInputSchema.shape.title,
    slug: adminPostSlugSchema,
    description: postInputSchema.shape.description,
    body: z
      .string()
      .min(1)
      .max(MAX_POST_MARKDOWN_LENGTH)
      .refine((body) => !body.includes('\u0000')),
    status: z.enum(['draft', 'published']).default('draft'),
    category_id: z.uuid().default(DEFAULT_POST_CATEGORY_ID),
    tags: blogPostMetadataInputSchema.shape.tags,
    cover_image_key: z
      .string()
      .refine(isAssetKey, '올바른 이미지 key가 필요합니다.')
      .nullable()
      .default(null),
    cover_alt: blogPostMetadataInputSchema.shape.cover_alt,
    cover_position_x: coordinate.optional(),
    cover_position_y: coordinate.optional(),
    position: z.object({ x: coordinate, y: coordinate }).strict().optional(),
    pin_order: z.number().int().min(1).max(5).nullable().optional(),
    published_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.status === 'draft') {
      for (const field of ['published_at', 'pin_order'] as const) {
        if (input[field] != null)
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: '초안의 발행 시각과 고정 순서는 null이어야 합니다.',
          });
      }
    }
    if (
      input.position &&
      ((input.cover_position_x !== undefined && input.cover_position_x !== input.position.x) ||
        (input.cover_position_y !== undefined && input.cover_position_y !== input.position.y))
    )
      ctx.addIssue({
        code: 'custom',
        path: ['position'],
        message: '커버 위치 입력이 서로 다릅니다.',
      });
  })
  .transform(({ position, ...input }) => ({
    ...input,
    cover_position_x: input.cover_position_x ?? position?.x ?? 0.5,
    cover_position_y: input.cover_position_y ?? position?.y ?? 0.5,
  }));

export type AdminPostInput = z.infer<typeof adminPostInputSchema>;
