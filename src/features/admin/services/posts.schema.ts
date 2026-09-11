import { z } from 'zod';

const slugPattern = /^[가-힣a-z0-9]+(?:-[가-힣a-z0-9]+)*$/;

export const postInputSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해 주세요.').max(160),
  slug: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().normalize('NFC') : value),
    z
      .string()
      .min(1, '슬러그를 입력해 주세요.')
      .max(160)
      .regex(slugPattern, '슬러그는 한글, 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'),
  ),
  description: z.string().trim().min(1, '설명을 입력해 주세요.').max(500),
  body: z.string().min(1, '본문을 입력해 주세요.'),
  status: z.enum(['draft', 'published']),
  category_id: z
    .string()
    .uuid('카테고리를 선택해 주세요.')
    .default('00000000-0000-4000-8000-000000000001'),
  tags: z.preprocess(
    (value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((tag) => tag.trim().toLocaleLowerCase('ko-KR'))
            .filter(Boolean)
        : value,
    z
      .array(z.string().min(1).max(80))
      .max(30)
      .transform((tags) => [...new Set(tags)])
      .default([]),
  ),
  cover_image_key: z.string().trim().max(1024).nullable().default(null),
  cover_image_url: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().url().nullable(),
  ),
  cover_position_x: z.coerce.number().min(0).max(1).default(0.5),
  cover_position_y: z.coerce.number().min(0).max(1).default(0.5),
  cover_alt: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : (value ?? null)),
    z.string().trim().min(1).max(300).nullable(),
  ),
});

export const postIdSchema = z.string().uuid('올바르지 않은 글 ID입니다.');
