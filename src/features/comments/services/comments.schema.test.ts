import { describe, expect, it } from 'vitest';
import { authorReplyInputSchema, commentInputSchema } from './comments.schema';
const parent_id = '00000000-0000-4000-8000-000000000001';

describe('authorReplyInputSchema', () => {
  it.each([1, 1000])('accepts trimmed body length %i', (length) => {
    expect(authorReplyInputSchema.parse({ parent_id, body: ` ${'가'.repeat(length)} ` })).toEqual({
      parent_id,
      body: '가'.repeat(length),
    });
  });
  it.each(['', ' ', '가'.repeat(1001), 'a\u0000b'])('rejects invalid body', (body) => {
    expect(authorReplyInputSchema.safeParse({ parent_id, body }).success).toBe(false);
  });
  it.each(['post_id', 'nickname', 'avatar_id', 'is_author', 'fingerprint_hash'])(
    'rejects client-controlled %s',
    (key) => {
      expect(
        authorReplyInputSchema.safeParse({ parent_id, body: '답글', [key]: 'forged' }).success,
      ).toBe(false);
    },
  );
  it('requires a UUID parent', () => {
    for (const value of [null, undefined, '', '123'])
      expect(authorReplyInputSchema.safeParse({ parent_id: value, body: '답글' }).success).toBe(
        false,
      );
  });
  it('keeps public reply and author fields forbidden', () => {
    const input = { nickname: '독자', avatar_id: 'clay-01', body: '댓글' };
    expect(commentInputSchema.safeParse(input).success).toBe(true);
    expect(commentInputSchema.safeParse({ ...input, parent_id }).success).toBe(false);
    expect(commentInputSchema.safeParse({ ...input, is_author: true }).success).toBe(false);
  });
});
