import { lazy } from "react";

export const BlogPostPageLazy = lazy(() =>
  import("./ui/Page").then(m => ({ default: m.BlogPostPage }))
);
