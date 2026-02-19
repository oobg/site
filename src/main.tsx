import "overlayscrollbars/styles/overlayscrollbars.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";

if (import.meta.env.DEV && import.meta.env.VITE_MSW === "true") {
  import("@/msw").then((m) => m.start());
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
