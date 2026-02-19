export const LANG_OPTIONS = [
  { value: "auto", label: "자동" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "js", label: "JavaScript" },
  { value: "jsx", label: "JSX" },
  { value: "sql", label: "SQL" },
] as const;

export type Lang = (typeof LANG_OPTIONS)[number]["value"];

/** 포맷/하이라이트에 쓸 수 있는 언어 (자동 제외) */
export type ResolvedLang = Exclude<Lang, "auto">;
