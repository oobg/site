export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  BLOG: { LIST: '/blog', DETAIL: (slug: string) => `/blog/${slug}` },
  PROJECTS: { LIST: '/projects', DETAIL: (slug: string) => `/projects/${slug}` },
  ADMIN: {
    HOME: '/admin',
    NEW_POST: '/admin/posts/new',
    POST: (id: string) => `/admin/posts/${id}`,
  },
} as const;
