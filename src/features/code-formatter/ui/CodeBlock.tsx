import "../lib/prism-setup";

import { Highlight } from "prism-react-renderer";
import Prism from "prismjs";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

import { loadPrismLanguage } from "../lib/loadPrismLanguage";
import { codeFormatterTheme } from "../lib/codeFormatterTheme";
import type { ResolvedLang } from "../lib/constants";

const LANG_TO_PRISM: Record<ResolvedLang, string> = {
  html: "markup",
  css: "css",
  js: "javascript",
  jsx: "jsx",
  sql: "sql",
};

type CodeBlockProps = {
  code: string;
  lang: ResolvedLang;
  className?: string;
};

export function CodeBlock({ code, lang, className }: CodeBlockProps) {
  const prismLang = LANG_TO_PRISM[lang];
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    loadPrismLanguage(prismLang).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [prismLang]);

  if (!ready) {
    return (
      <pre
        className={cn(
          "min-h-[12rem] w-full overflow-auto rounded-md border border-input bg-background p-3 text-sm font-mono",
          className
        )}
        data-language={prismLang}
      >
        <code className="block">{code}</code>
      </pre>
    );
  }

  return (
    <Highlight theme={codeFormatterTheme} code={code} language={prismLang} prism={Prism}>
      {({ className: innerClassName, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            "min-h-[12rem] w-full overflow-auto rounded-md border border-input bg-background p-3 text-sm font-mono",
            className
          )}
          style={style}
          data-language={prismLang}
        >
          <code className={cn(innerClassName, "block")}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}
