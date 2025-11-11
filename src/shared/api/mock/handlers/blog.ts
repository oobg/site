import { Server, Request } from 'miragejs';

import { notionPages } from '../factories/blog';

// 상태가 "발행됨"인 페이지만 필터링
function filterPublishedPages(pages: typeof notionPages) {
  return pages.filter((page) => {
    const statusProp = page.properties['상태'] as
      | { type?: string; status?: { name?: string } }
      | undefined;
    return statusProp?.type === 'status' && statusProp?.status?.name === '발행됨';
  });
}

export const blogHandlers = (server: Server) => {
  // Get all blog posts (Notion API: /api/notion/pages)
  server.get('/notion/pages', (_schema: unknown, request: Request) => {
    const pageParam = request.queryParams.page;
    const limitParam = request.queryParams.limit;
    const page = parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam || '1', 10);
    const limit = parseInt(Array.isArray(limitParam) ? limitParam[0] : limitParam || '20', 10);

    // 상태가 "발행됨"인 페이지만 필터링
    const publishedPages = filterPublishedPages(notionPages);
    const total = publishedPages.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedPages = publishedPages.slice(start, end);

    return {
      data: paginatedPages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // Get single blog post by title (Notion API: /api/notion/page?title=...)
  server.get('/notion/page', (_schema: unknown, request: Request) => {
    const titleParam = request.queryParams.title;
    const title = Array.isArray(titleParam) ? titleParam[0] : titleParam;

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 상태가 "발행됨"인 페이지만 필터링
    const publishedPages = filterPublishedPages(notionPages);
    const matchingPages = publishedPages.filter((page) => page.title === title);

    if (matchingPages.length === 0) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (matchingPages.length > 1) {
      return new Response(JSON.stringify({ error: 'Multiple pages found with the same title' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return matchingPages[0];
  });
};
