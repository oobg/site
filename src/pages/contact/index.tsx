import { lazy } from "react";

export const ContactPageLazy = lazy(() =>
  import("./ui/Page").then((m) => ({ default: m.ContactPage })),
);
