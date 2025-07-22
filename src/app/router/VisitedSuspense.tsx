import { type ReactNode, Suspense } from "react";
import { useVisitedStore } from "./useVisitedStore";

interface Props {
  path: string;
  fallback: ReactNode;
  children: ReactNode;
}

export function VisitedSuspense({ path, fallback, children }: Props) {
  const visitedPages = useVisitedStore((state) => state.visitedPages);

  if (visitedPages.has(path)) {
    return <>{children}</>;
  }

  return <Suspense fallback={fallback}>{children}</Suspense>;
}
