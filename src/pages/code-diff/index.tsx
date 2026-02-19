import { lazy } from "react";

export const CodeDiffPageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.CodeDiffPage })),
);
