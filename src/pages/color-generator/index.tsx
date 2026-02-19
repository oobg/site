import { lazy } from "react";

export const ColorGeneratorPageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.ColorGeneratorPage })),
);
