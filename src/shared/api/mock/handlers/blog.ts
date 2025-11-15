import { Server, Request } from 'miragejs';
import type { BlogPostListItem } from '../factories/blog';

import {
  notionPages,
  convertNotionPageToBlogPost,
} from '../factories/blog';

// Mock 블로그 리스트 데이터
const mockBlogListData: BlogPostListItem[] = [
  {
    id: '01864cd4-bb27-45b6-9844-1fb93b0be366',
    title: 'i18n 키 네이밍 규칙',
    category: 'i18n',
    tags: ['naming-rule'],
    createdBy: 'raven',
    created: '2025-10-01T05:20:00.000Z',
    edited: '2025-11-10T16:35:00.000Z',
  },
  {
    id: '94afb127-1525-4b69-a2fb-43f5b61cdd91',
    title: 'Github Copilot 커밋 룰 지정하기',
    category: 'Ai',
    tags: ['github-copilot', 'webstorm'],
    createdBy: 'raven',
    created: '2025-09-19T05:50:00.000Z',
    edited: '2025-11-10T16:35:00.000Z',
  },
  {
    id: '6a82ff26-09e4-4519-abad-d2279a05f8a6',
    title: 'React + Zustand + Tailwind로 합성 컴포넌트 기반 Dialog 만들기',
    category: 'Design-System',
    tags: ['zustand', 'tailwind'],
    createdBy: 'raven',
    created: '2025-09-12T05:08:00.000Z',
    edited: '2025-11-10T16:35:00.000Z',
  },
  {
    id: '6ef4ab10-68c4-4405-ad29-c87c3f91397a',
    title: 'React 프로젝트에서 CSR, SSR, SSG, ISR 차이와 선택 기준',
    category: 'React',
    tags: ['CSR', 'SSR', 'SSG', 'ISR'],
    createdBy: 'raven',
    created: '2025-09-12T04:55:00.000Z',
    edited: '2025-11-10T16:35:00.000Z',
  },
  {
    id: 'bbbd4f0c-66c3-4ca6-8f69-6a2e3ad2d9cb',
    title: '활성 사용자 세션 관리하기',
    category: 'Project',
    tags: ['react-query', 'localStorage', 'BroadcastChannel'],
    createdBy: 'raven',
    created: '2025-09-09T05:11:00.000Z',
    edited: '2025-11-10T16:36:00.000Z',
  },
  {
    id: '45f3e7b5-f768-4a8a-8b1e-0a0eab2ebd54',
    title: 'React 코드 스플리팅, Suspense와 React.lazy 제대로 활용하기',
    category: 'React',
    tags: ['Suspense', 'React.lazy'],
    createdBy: 'raven',
    created: '2025-09-05T05:48:00.000Z',
    edited: '2025-11-10T16:36:00.000Z',
  },
  {
    id: 'e2fb860c-7108-449b-8be7-14e1a25bf515',
    title: 'React 성능 최적화를 위해 ',
    category: 'React',
    tags: ['useCallback', 'useMemo'],
    createdBy: 'raven',
    created: '2025-09-05T05:39:00.000Z',
    edited: '2025-11-10T16:36:00.000Z',
  },
  {
    id: '19cd0a1c-71b4-4e45-a47d-498384fb9ccf',
    title: 'React Context API 한계와 Zustand 같은 대안 비교',
    category: 'React',
    tags: ['context', 'zustand'],
    createdBy: 'raven',
    created: '2025-09-05T02:46:00.000Z',
    edited: '2025-11-10T16:36:00.000Z',
  },
  {
    id: '1f2cf0fe-4db0-4a56-805a-3f3881af8dee',
    title: 'React 18 ',
    category: 'React',
    tags: ['useEffect'],
    createdBy: 'raven',
    created: '2025-08-27T07:17:00.000Z',
    edited: '2025-11-10T16:36:00.000Z',
  },
];

export const blogHandlers = (server: Server) => {
  // Get all blog posts (Notion API: /api/notion/pages)
  server.get('/notion/pages', (_schema: unknown, request: Request) => {
    const pageParam = request.queryParams.page;
    const limitParam = request.queryParams.limit;
    const page = parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam || '1', 10);
    const limit = parseInt(Array.isArray(limitParam) ? limitParam[0] : limitParam || '20', 10);

    const total = mockBlogListData.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedData = mockBlogListData.slice(start, end);

    return {
      data: paginatedData,
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

    return convertNotionPageToBlogPost(matchingPages[0]);
  });
};
