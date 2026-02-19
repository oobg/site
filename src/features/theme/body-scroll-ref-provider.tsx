import type { ReactNode } from "react";
import { useRef } from "react";

import {
  type BodyScrollInstance,
  BodyScrollRefContext,
} from "./body-scroll-ref-context";

export function BodyScrollRefProvider({ children }: { children: ReactNode }) {
  const ref = useRef<BodyScrollInstance | null>(null);
  return (
    <BodyScrollRefContext.Provider value={ref}>
      {children}
    </BodyScrollRefContext.Provider>
  );
}
