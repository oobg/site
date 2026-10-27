import { z } from 'zod';

const slugPattern = /^[가-힣a-z0-9]+(?:-[가-힣a-z0-9]+)*$/;

export const postInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요.')
    .max(160, '제목은 160자까지 입력할 수 있어요.'),
  slug: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().normalize('NFC') : value),
    z
      .string()
      .min(1, '슬러그를 입력해 주세요.')
      .max(160, 'URL은 160자까지 입력할 수 있어요.')
      .regex(slugPattern, '슬러그는 한글, 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'),
  ),
  description: z
    .string()
    .trim()
    .min(1, '설명을 입력해 주세요.')
    .max(500, '설명은 500자까지 입력할 수 있어요.'),
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
      .array(z.string().min(1).max(80, '태그는 하나에 80자까지 입력할 수 있어요.'))
      .max(30, '태그는 30개까지 입력할 수 있어요.')
      .transform((tags) => [...new Set(tags)])
      .default([]),
  ),
  cover_image_key: z
    .string()
    .trim()
    .max(1024, '대표 이미지 경로는 1024자까지 입력할 수 있어요.')
    .refine(
      (key) => !/^\/?assets\/embeds(?:\/|$)/.test(key),
      'HTML 임베드는 대표 이미지로 사용할 수 없어요.',
    )
    .nullable()
    .default(null),
  cover_image_url: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().url().nullable(),
  ),
  cover_position_x: z.coerce.number().min(0).max(1, '가로 위치는 1 이하여야 해요.').default(0.5),
  cover_position_y: z.coerce.number().min(0).max(1, '세로 위치는 1 이하여야 해요.').default(0.5),
  cover_alt: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : (value ?? null)),
    z.string().trim().min(1).max(300, '대체 텍스트는 300자까지 입력할 수 있어요.').nullable(),
  ),
});

export const postIdSchema = z.string().uuid('올바르지 않은 글 ID입니다.');

// Kept separate from content input: only updates require a revision precondition.
export const expectedUpdatedAtSchema = z
  .string()
  .datetime({ offset: true, message: '편집 기준을 확인할 수 없어요. 글을 다시 열어 주세요.' });
