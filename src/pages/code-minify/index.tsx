import { lazy } from "react";

export const CodeMinifyPageLazy = lazy(() =>
  import("./ui/Page").then(m => ({ default: m.CodeMinifyPage }))
);
