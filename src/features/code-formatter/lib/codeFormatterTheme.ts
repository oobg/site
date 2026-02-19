import type { PrismTheme } from "prism-react-renderer";
import { themes } from "prism-react-renderer";

/** 클래스명(.class, JSX className 등) — violet 계열 */
const CLASS_NAME_COLOR = "hsl(263 70% 65%)";
/** CSS selector·property(선택자, 속성명) — 별도 구분 */
const CSS_SELECTOR_PROPERTY_COLOR = "hsl(199 89% 48%)";
/** 주석 (블록·라인) */
const COMMENT_COLOR = "hsl(240 4% 56%)";

const base = themes.vsDark;

function overrideStyle(
  entry: { types: string[]; style: Record<string, unknown> },
  color: string
) {
  return {
    ...entry,
    style: { ...entry.style, color },
  };
}

export const codeFormatterTheme: PrismTheme = {
  ...base,
  styles: base.styles.map((entry) => {
    const types = entry.types ?? [];
    if (types.includes("class-name")) {
      return overrideStyle(entry, CLASS_NAME_COLOR);
    }
    if (types.includes("comment")) {
      return overrideStyle(entry, COMMENT_COLOR);
    }
    if (
      types.includes("selector") ||
      types.includes("property") ||
      types.includes("attr-name")
    ) {
      return overrideStyle(entry, CSS_SELECTOR_PROPERTY_COLOR);
    }
    return entry;
  }),
};
