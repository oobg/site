export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  PROJECTS_LIST: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  BLOG: "/blog",
  CONTACT: "/contact",
} as const;

export function projectDetailPath(id: string): string {
  return `/projects/${id}`;
}
