export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  PROJECTS_LIST: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  COLOR_GENERATOR: "/project/color/generator",
  CODE_DIFF: "/projects/code/diff",
  CODE_FORMATTER: "/projects/code/formatter",
  CODE_MINIFY: "/projects/code/minify",
  BLOG: "/blog",
  CONTACT: "/contact",
} as const;

/** 이동 시 토스트만 띄우고 네비게이션하지 않는 경로 */
export const PREPARING_ROUTES: string[] = [
  ROUTES.BLOG,
  ROUTES.CONTACT,
];

/** 준비 중 페이지 경로 → 토스트에 쓸 이름 */
export const PREPARING_ROUTE_LABELS: Record<string, string> = {
  [ROUTES.BLOG]: "Blog",
  [ROUTES.CONTACT]: "Contact",
};

export function projectDetailPath(id: string): string {
  return `/projects/${id}`;
}
