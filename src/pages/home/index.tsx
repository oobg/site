import { lazy } from "react";

export const HomePageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.HomePage })),
);
