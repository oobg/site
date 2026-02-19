/**
 * Prism 언어 컴포넌트를 필요 시점에만 동적 import해 청크 크기를 줄인다.
 * 한 번 로드된 언어는 캐시해 재요청하지 않는다.
 */

const loaded = new Set<string>();

function load(lang: string): Promise<void> {
  if (loaded.has(lang)) return Promise.resolve();
  const p = getImportForLang(lang);
  if (!p) return Promise.resolve();
  return p.then(() => {
    loaded.add(lang);
  });
}

function getImportForLang(prismLang: string): Promise<unknown> | null {
  switch (prismLang) {
    case "markup":
      return import("prismjs/components/prism-markup");
    case "css":
      return import("prismjs/components/prism-css");
    case "javascript":
      return import("prismjs/components/prism-javascript");
    case "jsx":
      return import("prismjs/components/prism-jsx");
    case "sql":
      return import("prismjs/components/prism-sql");
    default:
      return null;
  }
}

export function loadPrismLanguage(prismLang: string): Promise<void> {
  return load(prismLang);
}
