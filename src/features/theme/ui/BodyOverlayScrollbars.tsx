import { OverlayScrollbars } from "overlayscrollbars";
import { useContext, useEffect, useRef } from "react";

import { BodyScrollRefContext } from "../lib/bodyScrollRefContext";
import { useThemeStore } from "../lib/themeStore";

function getScrollbarTheme(effectiveTheme: "dark" | "light") {
  return effectiveTheme === "dark" ? "os-theme-light" : "os-theme-dark";
}

export function BodyOverlayScrollbars() {
  const effectiveTheme = useThemeStore(s => s.effectiveTheme);
  const osRef = useRef<ReturnType<typeof OverlayScrollbars> | null>(null);
  const bodyScrollRef = useContext(BodyScrollRefContext);

  useEffect(() => {
    const theme = getScrollbarTheme(effectiveTheme);
    const os = OverlayScrollbars(document.body, { scrollbars: { theme } });
    osRef.current = os;
    bodyScrollRef.current = os;
    return () => {
      os.destroy();
      osRef.current = null;
      bodyScrollRef.current = null;
    };
  }, [effectiveTheme, bodyScrollRef]);

  return null;
}
