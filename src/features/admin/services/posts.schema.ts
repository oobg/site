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
});

export const postIdSchema = z.string().uuid('올바르지 않은 글 ID입니다.');
