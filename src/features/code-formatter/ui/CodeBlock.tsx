import "../lib/prism-setup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-sql";

import { Highlight } from "prism-react-renderer";
import Prism from "prismjs";

import { cn } from "@/shared/lib/utils";

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
