import { describe, expect, it } from 'vitest';
import { toPlainSummary } from './plain-summary';

describe('toPlainSummary', () => {
  it('인라인 코드 백틱만 제거하고 식별자와 일반 문장을 보존한다', () => {
    expect(toPlainSummary('`Button`과 `Card`를 함께 사용한다.')).toBe(
      'Button과 Card를 함께 사용한다.',
    );
  });
});
