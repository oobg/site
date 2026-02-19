import { lazy } from "react";

export const AboutPageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.AboutPage })),
);
