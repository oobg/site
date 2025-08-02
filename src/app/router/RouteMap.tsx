import { type FC, type ReactNode, lazy } from "react";

const HomePage = lazy(() => import("@src/pages/home/ui/HomePage"));
const AboutPage = lazy(() => import("@src/pages/about/ui/AboutPage"));

interface RouteConfig {
  path: string;
  fallback: ReactNode;
  Component: FC;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    fallback: <div>홈 로딩중...</div>,
    Component: HomePage,
  },
  {
    path: "/about",
    fallback: <div>어바웃 로딩중...</div>,
    Component: AboutPage,
  },
];
