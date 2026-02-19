import { OverlayScrollbars } from "overlayscrollbars";
import { createContext } from "react";

export type BodyScrollInstance = Exclude<
  ReturnType<typeof OverlayScrollbars>,
  undefined
>;

const defaultRef = { current: null as BodyScrollInstance | null };

export const BodyScrollRefContext =
  createContext<React.MutableRefObject<BodyScrollInstance | null>>(defaultRef);
