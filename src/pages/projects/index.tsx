import { lazy } from "react";

export const ProjectsPageLazy = lazy(() =>
  import("./ui/Page").then(m => ({ default: m.ProjectsPage }))
);
