import Prism from "prismjs";

const g =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : ({} as Record<string, unknown>);

(g as Record<string, unknown>).Prism = Prism;
