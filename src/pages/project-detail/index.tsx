import { lazy } from "react";

export const ProjectDetailPageLazy = lazy(() =>
  import("./ui/Page").then(m => ({ default: m.ProjectDetailPage }))
);
