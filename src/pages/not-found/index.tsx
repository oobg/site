import { lazy } from "react";

export const NotFoundPageLazy = lazy(() =>
  import("./ui/Page").then(m => ({ default: m.NotFoundPage }))
);
