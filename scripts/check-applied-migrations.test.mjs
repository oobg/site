import { describe, expect, it } from 'vitest';
import { findMissingMigrations } from './check-applied-migrations.mjs';

const files = [
  '20260911020000_add_comment_replies.sql',
  '20260907000000_create_posts.sql',
  '20260911100000_use_korean_category_slugs.sql',
];

describe('findMissingMigrations', () => {
  it('ledger에 없는 파일을 이름 순서로 돌려준다', () => {
    expect(findMissingMigrations(files, ['20260907000000_create_posts.sql', ''])).toEqual({
      status: 'missing',
      missing: ['20260911020000_add_comment_replies.sql', '20260911100000_use_korean_category_slugs.sql'],
    });
  });

  it('모든 파일이 ledger에 있으면 ok다', () => {
    expect(findMissingMigrations(files, [...files])).toEqual({ status: 'ok', missing: [] });
  });

  it('저장소에 없는 ledger 행은 무시한다', () => {
    expect(findMissingMigrations(files, [...files, '20990101000000_future.sql'])).toEqual({
      status: 'ok',
      missing: [],
    });
  });

  it('ledger 표가 없으면 ledger-missing이다', () => {
    expect(findMissingMigrations(files, null)).toEqual({ status: 'ledger-missing' });
  });

  it('ledger가 비어 있으면 전부 missing이다', () => {
    expect(findMissingMigrations(files, [])).toMatchObject({ status: 'missing', missing: [...files].sort() });
  });
});
