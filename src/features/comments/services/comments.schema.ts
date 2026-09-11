import { z } from 'zod';

export const commentInputSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value)),
    avatar_id: z.string().regex(/^clay-(0[1-9]|[1-5][0-9]|6[0-4])$/),
    body: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .refine((value) => !value.includes('\u0000')),
  })
  .strict();

export const commentCursorSchema = z.object({
  created_at: z.string().datetime({ offset: true }),
  id: z.string().uuid(),
});

export type CommentInput = z.infer<typeof commentInputSchema>;
