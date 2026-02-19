import type { ResolvedLang } from "./constants";

/**
 * 입력 코드에서 언어를 휴리스틱으로 추정합니다.
 * 순서: HTML → SQL → CSS → JSX → JS(기본).
 */
export function detectLang(code: string): ResolvedLang {
  const t = code.trim();
  if (!t) return "js";

  // HTML: DOCTYPE, html/head/body 또는 소문자 태그
  if (
    /<!DOCTYPE/i.test(t) ||
    /<html[\s>]/i.test(t) ||
    /<head[\s>]/i.test(t) ||
    /<body[\s>]/i.test(t)
  ) {
    return "html";
  }
  if (/<[a-z][a-z0-9]*[\s/>]|<\/[a-z]/.test(t)) {
    return "html";
  }

  // SQL: 전형적인 키워드 패턴
  if (
    /\bSELECT\b.*\bFROM\b/i.test(t) ||
    /\bINSERT\s+INTO\b/i.test(t) ||
    /\bUPDATE\s+\w+\s+SET\b/i.test(t) ||
    /\bDELETE\s+FROM\b/i.test(t) ||
    /\bCREATE\s+TABLE\b/i.test(t)
  ) {
    return "sql";
  }

  // CSS: @규칙 또는 selector { / prop: value;
  if (
    /@media\b|@keyframes\b|@import\b|@charset\b/.test(t) ||
    (/\b[\w-]+\s*\{[\s\S]*\b[\w-]+\s*:/.test(t) &&
      /[\w-]+\s*:\s*[^;]+;/.test(t))
  ) {
    return "css";
  }

  // JSX: PascalCase 태그 또는 className=
  if (/<[A-Z][a-zA-Z0-9]*[\s/>]|<\w+\.\w+/.test(t) || /className\s*=/.test(t)) {
    return "jsx";
  }

  return "js";
}
