import { lazy } from "react";

export const BlogPageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.BlogPage })),
);
