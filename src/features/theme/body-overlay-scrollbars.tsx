import { OverlayScrollbars } from "overlayscrollbars";
import { useEffect, useRef } from "react";

import { useThemeStore } from "./theme-store";

function getScrollbarTheme(effectiveTheme: "dark" | "light") {
  return effectiveTheme === "dark" ? "os-theme-light" : "os-theme-dark";
}

export function BodyOverlayScrollbars() {
  const effectiveTheme = useThemeStore(s => s.effectiveTheme);
  const osRef = useRef<ReturnType<typeof OverlayScrollbars> | null>(null);

  useEffect(() => {
    const theme = getScrollbarTheme(effectiveTheme);
    const os = OverlayScrollbars(document.body, { scrollbars: { theme } });
    osRef.current = os;
    return () => {
      os.destroy();
      osRef.current = null;
    };
  }, [effectiveTheme]);

  return null;
}
