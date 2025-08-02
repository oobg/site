import { type FC, type ReactNode, lazy } from "react";

const HomePage = lazy(() => import("@src/pages/home/ui/HomePage"));
const AboutPage = lazy(() => import("@src/pages/about/ui/AboutPage"));
const PortfolioPage = lazy(() => import("@src/pages/portfolio/ui/PortfolioPage"));

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
  {
    path: "/portfolio",
    fallback: <div>포트폴리오 로딩중...</div>,
    Component: PortfolioPage,
  },
];
