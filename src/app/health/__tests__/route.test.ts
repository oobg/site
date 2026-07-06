import { describe, it, expect } from 'vitest';
import { GET } from '@/app/health/route';

describe('GET /health', () => {
  it('status ready를 200으로 반환한다', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ready' });
  });
});
