import * as parserBabel from "prettier/plugins/babel";
import * as pluginEstree from "prettier/plugins/estree";
import * as parserHtml from "prettier/plugins/html";
import * as parserPostcss from "prettier/plugins/postcss";
import * as prettier from "prettier/standalone";
import { format as formatSql } from "sql-formatter";

import type { Lang } from "./constants";

/** estree must be first so JS/JSX (and embedded script in HTML) format correctly. */
const PRETTIER_PLUGINS = [
  pluginEstree,
  parserHtml,
  parserBabel,
  parserPostcss,
];

const isParseError = (msg: string) =>
  /Unexpected token|SyntaxError|Expected |Invalid/i.test(msg);

function formatWithPrettier(parser: string, trimmed: string): Promise<string> {
  return prettier.format(trimmed, {
    parser,
    plugins: PRETTIER_PLUGINS,
    printWidth: 80,
  });
}

export async function formatCode(lang: Lang, code: string): Promise<string> {
  const trimmed = code.trim();
  if (!trimmed) return "";

  if (lang === "sql") {
    return formatSql(trimmed);
  }

  const parser = lang === "css" ? "css" : lang === "html" ? "html" : "babel";

  try {
    return await formatWithPrettier(parser, trimmed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (lang === "html" && isParseError(message)) {
      throw new Error(
        `${message}\n\n` +
          "HTML 안 <script> 블록의 JavaScript에서 오류가 났을 수 있습니다. " +
          "줄 끝에 세미콜론(;)을 넣거나, 스크립트만 복사해 언어를 JavaScript로 선택한 뒤 정렬해 보세요."
      );
    }
    throw err;
  }
}
