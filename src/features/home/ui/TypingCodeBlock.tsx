import { useEffect, useState } from "react";

import {
  tokenizeCode,
  TYPING_INTERVAL_MS,
  VSCODE_TOKEN_CLASS,
} from "../lib/tokenizeCode";

export function TypingCodeBlock({ lines }: { lines: string[] }) {
  const fullText = lines.join("\n");
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCharIndex(prev => {
        const next = prev + 1;
        if (next >= fullText.length) clearInterval(id);
        return Math.min(next, fullText.length);
      });
    }, TYPING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fullText]);

  const isComplete = charIndex >= fullText.length;
  const tokens = tokenizeCode(fullText);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius)] border border-border font-mono text-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="border-b border-border bg-zinc-200/80 px-3 py-2 text-xs text-zinc-500 dark:bg-[#252526] dark:text-[#858585]">
        index.ts
      </div>
      <div className="min-h-[7.5rem] bg-zinc-100 p-4 dark:bg-[#1e1e1e]">
        <pre className="m-0 min-h-[6rem] whitespace-pre-wrap break-all font-normal leading-relaxed">
          {tokens.map((t, idx) => {
            if (t.end <= charIndex) {
              return (
                <span key={idx} className={VSCODE_TOKEN_CLASS[t.type]}>
                  {fullText.slice(t.start, t.end)}
                </span>
              );
            }
            if (t.start < charIndex) {
              return (
                <span key={idx} className={VSCODE_TOKEN_CLASS[t.type]}>
                  {fullText.slice(t.start, charIndex)}
                </span>
              );
            }
            return null;
          })}
          <span
            className={
              isComplete ? "animate-pulse text-primary" : "text-primary"
            }
            aria-hidden
          >
            |
          </span>
        </pre>
      </div>
    </div>
  );
}
