export const ROUTES = {
  HOME: '/',
  BLOG: { LIST: '/blog', DETAIL: (slug: string) => `/blog/${slug}` },
  PROJECTS: { LIST: '/projects', DETAIL: (slug: string) => `/projects/${slug}` },
} as const;
