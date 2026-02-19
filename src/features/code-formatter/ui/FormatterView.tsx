import { Copy } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";

import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";

import { type Lang, LANG_OPTIONS, type ResolvedLang } from "../lib/constants";
import { detectLang } from "../lib/detectLang";

const CodeBlockLazy = lazy(() =>
  import("./CodeBlock").then((m) => ({ default: m.CodeBlock }))
);

const RESOLVED_LANG_LABELS: Record<ResolvedLang, string> = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  jsx: "JSX",
  sql: "SQL",
};

const textareaClass =
  "min-h-[12rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function FormatterView() {
  const [lang, setLang] = useState<Lang>("auto");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [resolvedLang, setResolvedLang] = useState<ResolvedLang | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormat = useCallback(async () => {
    setError(null);
    setResult(null);
    if (!input.trim()) return;
    const effectiveLang: ResolvedLang =
      lang === "auto" ? detectLang(input) : lang;
    setResolvedLang(effectiveLang);
    setIsFormatting(true);
    try {
      const { formatCode } = await import("../lib/format");
      const formatted = await formatCode(effectiveLang, input);
      setResult(formatted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "포맷 중 오류가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setIsFormatting(false);
    }
  }, [lang, input]);

  const displayLang = resolvedLang ?? (lang === "auto" ? "js" : lang);

  const handleCopy = useCallback(() => {
    if (result == null) return;
    void navigator.clipboard.writeText(result).then(() => {
      toast.success("결과가 클립보드에 복사되었습니다.");
    });
  }, [result]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-2">
          <label htmlFor="formatter-lang" className="text-sm font-medium">
            언어
          </label>
          <Select
            id="formatter-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="w-auto min-w-[8rem]"
            aria-label="포맷할 코드 언어 선택"
          >
            {LANG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="formatter-input" className="text-sm font-medium">
          입력
        </label>
        <textarea
          id="formatter-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={textareaClass}
          placeholder="포맷할 코드를 입력하세요"
          spellCheck={false}
          aria-describedby="formatter-input-desc"
        />
        <p id="formatter-input-desc" className="text-xs text-muted-foreground">
          선택한 언어에 맞는 코드를 입력한 뒤 정렬 버튼을 누르세요.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleFormat}
        disabled={isFormatting || !input.trim()}
        className="inline-flex items-center gap-1.5"
      >
        {isFormatting ? "정렬 중…" : "정렬"}
      </Button>

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive whitespace-pre-line"
          id="formatter-error"
        >
          {error}
        </p>
      )}

      {result != null && (
        <div className="space-y-2 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="formatter-output"
                className="text-sm font-medium"
                id="formatter-output-label"
              >
                결과
              </label>
              {lang === "auto" && resolvedLang != null && (
                <span className="text-xs text-muted-foreground">
                  감지된 언어: {RESOLVED_LANG_LABELS[resolvedLang]}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5"
              aria-label="결과 클립보드에 복사"
            >
              <Copy className="size-4" aria-hidden />
              복사
            </Button>
          </div>
          <div
            id="formatter-output"
            role="region"
            aria-labelledby="formatter-output-label"
            className="overflow-hidden rounded-md border border-input"
          >
            <Suspense
              fallback={
                <pre className="min-h-[12rem] w-full overflow-auto rounded-md border-0 bg-background p-3 text-sm font-mono text-muted-foreground">
                  로딩 중…
                </pre>
              }
            >
              <CodeBlockLazy code={result} lang={displayLang} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
