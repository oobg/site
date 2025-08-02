import { type FC, type ReactNode, lazy } from "react";

const HomePage = lazy(() => import("@src/pages/home/ui/HomePage"));
const AboutPage = lazy(() => import("@src/pages/about/ui/AboutPage"));
const PortfolioPage = lazy(() => import("@src/pages/portfolio/ui/PortfolioPage"));
const NotFoundPage = lazy(() => import("@src/pages/not-found/ui/NotFoundPage"));

export interface RouteConfig {
  path: string;
  fallback: ReactNode;
  Component: FC;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    fallback: "홈 로딩중...",
    Component: HomePage,
  },
  {
    path: "/about",
    fallback: "어바웃 로딩중...",
    Component: AboutPage,
  },
  {
    path: "/portfolio",
    fallback: "포트폴리오 로딩중...",
    Component: PortfolioPage,
  },
  {
    path: "*",
    fallback: "페이지 로딩중...",
    Component: NotFoundPage,
  },
]; 