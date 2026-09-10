import { afterEach, describe, expect, it, vi } from 'vitest';

type QueryResult = { data: unknown[] | null; error: null | { message: string }; count?: number };
interface TestQuery extends PromiseLike<QueryResult> {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
}

function query(result: QueryResult) {
  const builder: TestQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    not: vi.fn(),
    contains: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    range: vi.fn(),
    then: (resolve) => Promise.resolve(result).then(resolve),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.not.mockReturnValue(builder);
  builder.contains.mockReturnValue(builder);
  builder.or.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.range.mockReturnValue(builder);
  return builder;
}

describe('getBlogHomeDataUncached supabase', () => {
  afterEach(() => {
    vi.doUnmock('@lib/supabase/public');
    vi.doUnmock('next/cache');
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('archive는 DB pagination/count를 쓰고 shell은 bounded 공개 query를 쓴다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    const category = {
      id: '00000000-0000-4000-8000-000000000001',
      slug: 'engineering',
      name: '개발',
      sort_order: 1,
      is_default: false,
    };
    const row = {
      title: '공개 글',
      slug: 'public-post',
      description: '요약',
      status: 'published',
      published_at: '2026-09-10T00:00:00Z',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
      tags: ['react'],
      cover_image_key: 'assets/posts/cover.webp',
      cover_image_url: null,
      cover_position_x: 0.5,
      cover_position_y: 0.5,
      cover_alt: null,
      pin_order: 1,
      category,
    };
    const archive = query({ data: [row], error: null, count: 13 });
    const categories = query({ data: [{ ...category, posts: [{ count: 1 }] }], error: null });
    const pinned = query({ data: [row], error: null });
    const section = query({ data: [row], error: null });
    const postQueries = [archive, pinned, section];
    const from = vi.fn((table: string) =>
      table === 'post_categories' ? categories : postQueries.shift(),
    );
    vi.doMock('next/cache', () => ({
      unstable_cache:
        <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) =>
        (...args: TArgs) =>
          fn(...args),
    }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));

    const { getBlogHomeDataUncached } = await import('@features/posts/services/posts.api');
    const result = await getBlogHomeDataUncached({
      q: '기호_%\\',
      category: 'engineering',
      tag: 'react',
      page: 2,
      pageSize: 6,
    });

    expect(archive.eq).toHaveBeenCalledWith('status', 'published');
    expect(archive.eq).toHaveBeenCalledWith('category.slug', 'engineering');
    expect(archive.contains).toHaveBeenCalledWith('tags', ['react']);
    expect(archive.or).toHaveBeenCalledWith(
      'title.ilike."%기호\\\\_\\\\%\\\\\\\\%",description.ilike."%기호\\\\_\\\\%\\\\\\\\%"',
    );
    expect(archive.range).toHaveBeenCalledWith(6, 11);
    expect(pinned.not).toHaveBeenCalledWith('pin_order', 'is', null);
    expect(pinned.limit).toHaveBeenCalledWith(5);
    expect(section.eq).toHaveBeenCalledWith('status', 'published');
    expect(section.eq).toHaveBeenCalledWith('category_id', category.id);
    expect(section.limit).toHaveBeenCalledWith(3);
    expect(result.archive).toMatchObject({ page: 2, pageSize: 6, totalItems: 13, totalPages: 3 });
    expect(result.featured.map(({ slug }) => slug)).toEqual(['public-post']);
    expect(result.featured[0].cover_image_url).toBe('/assets/posts/cover.webp');
    expect(result.categories.map(({ slug }) => slug)).toEqual(['engineering']);
    expect(result.sections).toEqual([
      expect.objectContaining({
        category: expect.objectContaining({ slug: 'engineering' }),
        posts: [expect.objectContaining({ slug: 'public-post' })],
      }),
    ]);
  });

  it('pin이 없으면 section별 최신 글을 대표 후보로 재사용한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const categories = [
      {
        id: '00000000-0000-4000-8000-000000000010',
        slug: 'backend',
        name: '백엔드',
        sort_order: 1,
        is_default: false,
        posts: [{ count: 4 }],
      },
      {
        id: '00000000-0000-4000-8000-000000000020',
        slug: 'design',
        name: '디자인',
        sort_order: 2,
        is_default: false,
        posts: [{ count: 2 }],
      },
    ];
    const makeRow = (slug: string, category: (typeof categories)[number], date: string) => ({
      title: slug,
      slug,
      description: '',
      status: 'published',
      published_at: date,
      created_at: date,
      updated_at: date,
      tags: [],
      cover_image_key: null,
      cover_image_url: null,
      cover_position_x: 0.5,
      cover_position_y: 0.5,
      cover_alt: null,
      pin_order: null,
      category,
    });
    const archive = query({ data: [], error: null, count: 0 });
    const categoryQuery = query({ data: categories, error: null });
    const pinned = query({ data: [], error: null });
    const backend = query({
      data: [
        makeRow('backend-new', categories[0], '2026-09-09T00:00:00Z'),
        makeRow('backend-old', categories[0], '2026-09-01T00:00:00Z'),
      ],
      error: null,
    });
    const design = query({
      data: [makeRow('design-new', categories[1], '2026-09-10T00:00:00Z')],
      error: null,
    });
    const postQueries = [archive, pinned, backend, design];
    vi.doMock('next/cache', () => ({
      unstable_cache:
        <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) =>
        (...args: TArgs) =>
          fn(...args),
    }));
    vi.doMock('@lib/supabase/public', () => ({
      createPublicClient: () => ({
        from: (table: string) =>
          table === 'post_categories' ? categoryQuery : postQueries.shift(),
      }),
    }));

    const { getBlogHomeDataUncached } = await import('@features/posts/services/posts.api');
    const result = await getBlogHomeDataUncached();

    expect(result.sections.map(({ posts }) => posts.map(({ slug }) => slug))).toEqual([
      ['backend-new', 'backend-old'],
      ['design-new'],
    ]);
    expect(result.featured.map(({ slug }) => slug)).toEqual(['design-new', 'backend-new']);
    expect(backend.limit).toHaveBeenCalledWith(3);
    expect(design.limit).toHaveBeenCalledWith(3);
  });
});
