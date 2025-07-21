import { BrowserRouter, Routes, Route } from "react-router-dom";
import { routes } from "./router";
import { VisitedSuspense } from "./router/VisitedSuspense";
import { useTrackVisited } from "./router/useTrackVisited";

function RouterContent() {
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

export default function App() {
    return (
        <BrowserRouter>
            <RouterContent />
        </BrowserRouter>
    );
}