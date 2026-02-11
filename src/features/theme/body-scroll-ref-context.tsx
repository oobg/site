import { createContext, useRef, type ReactNode } from "react";
import { OverlayScrollbars } from "overlayscrollbars";

type BodyScrollInstance = Exclude<
  ReturnType<typeof OverlayScrollbars>,
  undefined
>;

const defaultRef = { current: null as BodyScrollInstance | null };

export const BodyScrollRefContext = createContext<
  React.MutableRefObject<BodyScrollInstance | null>
>(defaultRef);

export function BodyScrollRefProvider({ children }: { children: ReactNode }) {
  const ref = useRef<BodyScrollInstance | null>(null);
  return (
    <BodyScrollRefContext.Provider value={ref}>
      {children}
    </BodyScrollRefContext.Provider>
  );
}
