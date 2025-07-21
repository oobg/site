import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { lazyElement } from "./lazyRoute";

// 절대 경로나 상대 경로는 프로젝트 셋팅에 맞게 조정
const HomePage = lazy(() => import("../../pages/HomePage"));
const AboutPage = lazy(() => import("../../pages/AboutPage"));

export const router = createBrowserRouter([
    {
        path: "/",
        element: lazyElement(HomePage),
    },
    {
        path: "/about",
        element: lazyElement(AboutPage, <div>About 로딩중...</div>),
    },
]);
