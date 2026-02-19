export type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "identifier"
  | "plain";

export interface Token {
  type: TokenType;
  start: number;
  end: number;
}

export function tokenizeCode(text: string): Token[] {
  const tokens: Token[] = [];
  const keywords = new Set(["const", "export", "default"]);
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const keyword = rest.match(/^\b(const|export|default)\b/);
    const string = rest.match(/^"(?:[^"\\]|\\.)*"/);
    const comment = rest.match(/^\/\/[^\n]*/);
    const identifier = rest.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (keyword) {
      tokens.push({ type: "keyword", start: i, end: i + keyword[0].length });
      i += keyword[0].length;
    } else if (string) {
      tokens.push({ type: "string", start: i, end: i + string[0].length });
      i += string[0].length;
    } else if (comment) {
      tokens.push({ type: "comment", start: i, end: i + comment[0].length });
      i += comment[0].length;
    } else if (identifier && !keywords.has(identifier[0])) {
      tokens.push({
        type: "identifier",
        start: i,
        end: i + identifier[0].length,
      });
      i += identifier[0].length;
    } else {
      tokens.push({ type: "plain", start: i, end: i + 1 });
      i += 1;
    }
  }
  return tokens;
}

/** 라이트: VS Code Light+ 스타일, 다크: VS Code Dark+ 스타일 */
export const VSCODE_TOKEN_CLASS: Record<TokenType, string> = {
  keyword: "text-blue-600 dark:text-[#569cd6]",
  string: "text-[#a31515] dark:text-[#ce9178]",
  comment: "text-green-700 dark:text-[#6a9955]",
  identifier: "text-[#001080] dark:text-[#9cdcfe]",
  plain: "text-zinc-800 dark:text-[#d4d4d4]",
};

export const TYPING_INTERVAL_MS = 48;
