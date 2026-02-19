import { Copy } from "lucide-react";
import { useCallback, useState } from "react";

import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";

import type { OutputFormat } from "../lib/transform";
import { transformJs } from "../lib/transform";

const OUTPUT_FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "formatted", label: "포매팅" },
  { value: "oneline", label: "한줄" },
];

const textareaClass =
  "min-h-[12rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function MinifyView() {
  const [source, setSource] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("oneline");
  const [uglify, setUglify] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  const handleTransform = useCallback(async () => {
    setError(null);
    setResult(null);
    if (!source.trim()) return;
    setIsTransforming(true);
    try {
      const output = await transformJs(source, { outputFormat, uglify });
      setResult(output);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "변환 중 오류가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setIsTransforming(false);
    }
  }, [source, outputFormat, uglify]);

  const handleCopy = useCallback(() => {
    if (result == null) return;
    void navigator.clipboard.writeText(result).then(() => {
      toast.success("결과가 클립보드에 복사되었습니다.");
    });
  }, [result]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="minify-source" className="text-sm font-medium">
          원본 소스
        </label>
        <textarea
          id="minify-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={textareaClass}
          placeholder="JavaScript 코드를 입력하세요"
          spellCheck={false}
          aria-describedby="minify-source-desc"
        />
        <p id="minify-source-desc" className="text-xs text-muted-foreground">
          JavaScript 코드를 입력한 뒤 옵션을 선택하고 변환 버튼을 누르세요.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="space-y-2">
          <label htmlFor="minify-format" className="text-sm font-medium">
            출력 형식
          </label>
          <Select
            id="minify-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="w-auto min-w-[8rem]"
            aria-label="포매팅 또는 한줄 선택"
          >
            {OUTPUT_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="minify-uglify"
            type="checkbox"
            checked={uglify}
            onChange={(e) => setUglify(e.target.checked)}
            className="size-4 rounded border border-input"
            aria-describedby="minify-uglify-desc"
          />
          <label
            htmlFor="minify-uglify"
            className="text-sm font-medium cursor-pointer"
          >
            Uglify (변수명 짧게, 불필요 제거)
          </label>
          <span id="minify-uglify-desc" className="sr-only">
            켜면 변수명을 짧게 하고 불필요한 코드를 제거합니다.
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleTransform}
        disabled={isTransforming || !source.trim()}
        className="inline-flex items-center gap-1.5"
      >
        {isTransforming ? "변환 중…" : "변환"}
      </Button>

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive whitespace-pre-line"
          id="minify-error"
        >
          {error}
        </p>
      )}

      {result != null && (
        <div className="space-y-2 border-t border-border pt-6">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="minify-output"
              className="text-sm font-medium"
              id="minify-output-label"
            >
              출력 소스
            </label>
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
          <textarea
            id="minify-output"
            readOnly
            value={result}
            className={textareaClass}
            aria-labelledby="minify-output-label"
            aria-readonly="true"
          />
        </div>
      )}
    </div>
  );
}
