import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getBlogHomeData } = vi.hoisted(() => ({ getBlogHomeData: vi.fn() }));
vi.mock('@features/posts/services/posts.api', () => ({ getBlogHomeData }));

import { GET } from '@/app/api/posts/route';

const empty = {
  featured: [],
  categories: [],
  sections: [],
  archive: { items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
};

describe('GET /api/posts', () => {
  beforeEach(() => {
    getBlogHomeData.mockReset();
    getBlogHomeData.mockResolvedValue(empty);
  });

  it('검증·정규화한 공개 필터만 service로 전달하고 HTTP cache를 끈다', async () => {
    const response = await GET(
      new Request(
        'https://raven.kr/api/posts?q=%20RSC%20&category=engineering&tag=react&page=2&pageSize=6',
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(getBlogHomeData).toHaveBeenCalledWith({
      q: 'RSC',
      category: 'engineering',
      tag: 'react',
      page: 2,
      pageSize: 6,
    });
    await expect(response.json()).resolves.toEqual(empty);
  });

  it('잘못된 page와 반복되지 않는 unknown 입력을 거절한다', async () => {
    const response = await GET(new Request('https://raven.kr/api/posts?page=0'));
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(getBlogHomeData).not.toHaveBeenCalled();
  });

  it('service 오류의 내부 내용을 숨긴다', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getBlogHomeData.mockRejectedValue(new Error('database secret'));
    const response = await GET(new Request('https://raven.kr/api/posts'));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: '공개 글을 불러오지 못했습니다.' });
    expect(log).toHaveBeenCalledWith('Public posts query failed', { kind: 'Error' });
    log.mockRestore();
  });
});
