import { Routes, Route } from "react-router-dom";

import { routes } from "./RouteMap";
import { useTrackVisited } from "./useTrackVisited";
import { VisitedSuspense } from "./VisitedSuspense";

export function RouterContent() {
  useTrackVisited();

  return (
    <Routes>
      {routes.map(({ path, fallback, Component }) => (
        <Route
          key={path}
          path={path}
          element={
            <VisitedSuspense path={path} fallback={fallback}>
              <Component />
            </VisitedSuspense>
          }
        />
      ))}
    </Routes>
  );
}
