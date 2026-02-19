import { lazy } from "react";

export const CodeFormatterPageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.CodeFormatterPage })),
);
