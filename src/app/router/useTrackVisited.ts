import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVisitedStore } from "./useVisitedStore";

export function useTrackVisited() {
  const location = useLocation();
  const addVisited = useVisitedStore((state) => state.addVisited);

  useEffect(() => {
    addVisited(location.pathname);
  }, [location.pathname, addVisited]);
}
