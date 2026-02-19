import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "@/app/root-layout";
import { AboutPage } from "@/pages/about";
import { BlogPage } from "@/pages/blog";
import { ColorGeneratorPage } from "@/pages/color-generator";
import { ContactPage } from "@/pages/contact";
import { HomePage } from "@/pages/home";
import { NotFoundPage } from "@/pages/not-found";
import { ProjectDetailPage } from "@/pages/project-detail";
import { ProjectsPage } from "@/pages/projects";
import { ROUTES } from "@/shared/config/routes";

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "project/color/generator", element: <ColorGeneratorPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
