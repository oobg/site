import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/root-layout";
import {
  AboutPageLazy,
  BlogPageLazy,
  CodeDiffPageLazy,
  CodeFormatterPageLazy,
  CodeMinifyPageLazy,
  ColorGeneratorPageLazy,
  ContactPageLazy,
  HomePageLazy,
  NotFoundPageLazy,
  ProjectDetailPageLazy,
  ProjectsPageLazy,
} from "@/pages";
import { ROUTES } from "@/shared/config/routes";

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePageLazy /> },
      { path: "about", element: <AboutPageLazy /> },
      { path: "projects", element: <ProjectsPageLazy /> },
      { path: "projects/:id", element: <ProjectDetailPageLazy /> },
      { path: "project/color/generator", element: <ColorGeneratorPageLazy /> },
      { path: "projects/code/diff", element: <CodeDiffPageLazy /> },
      { path: "projects/code/formatter", element: <CodeFormatterPageLazy /> },
      { path: "projects/code/minify", element: <CodeMinifyPageLazy /> },
      { path: "blog", element: <BlogPageLazy /> },
      { path: "contact", element: <ContactPageLazy /> },
      { path: "*", element: <NotFoundPageLazy /> },
    ],
  },
]);
