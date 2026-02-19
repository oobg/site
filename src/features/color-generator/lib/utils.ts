import type { ColorScale } from "@/shared/lib/triadicColorGenerator";

import { DEFAULT_SEED_HEX, SCALE_KEYS } from "./constants";

/** 컬러 피커용 #rrggbb 반환 (짧은 hex는 확장, 잘못된 값은 기본값) */
export function toPickerHex(hex: string): string {
  const s = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(s)) return "#" + s.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(s))
    return "#" + [...s].map((c) => c + c).join("").toLowerCase();
  return DEFAULT_SEED_HEX;
}

export function scaleToCssVars(
  scale: { primary: ColorScale; secondary: ColorScale; tertiary: ColorScale },
  prefix: string,
  lineIndent = "  "
): string {
  const lines: string[] = [];
  for (const [name, s] of [
    ["primary", scale.primary],
    ["secondary", scale.secondary],
    ["tertiary", scale.tertiary],
  ] as const) {
    for (const key of SCALE_KEYS) {
      lines.push(`${lineIndent}--${name}-${key}: ${s[key]};`);
    }
  }
  return `${prefix} {\n${lines.join("\n")}\n}`;
}
