import { transform as sucraseTransform } from "sucrase";
import { minify as terserMinify } from "terser";

export type OutputFormat = "formatted" | "oneline";

export interface TransformOptions {
  outputFormat: OutputFormat;
  uglify: boolean;
}

/**
 * TypeScript 타입 구문을 제거해 순수 JavaScript로 만듭니다.
 * Terser는 JS만 파싱하므로 TS 입력 시 먼저 적용합니다.
 */
function stripTypeScript(code: string): string {
  try {
    const result = sucraseTransform(code, {
      transforms: ["typescript"],
      filePath: "input.ts",
    });
    return result.code;
  } catch {
    return code;
  }
}

/**
 * JavaScript/TypeScript 소스를 minify/uglify 또는 포매팅합니다.
 * - TypeScript 입력 시 타입을 제거한 뒤 변환합니다.
 * - outputFormat: 'formatted' → beautify, 'oneline' → 한 줄
 * - uglify: true면 mangle + compress 적용
 */
export async function transformJs(
  source: string,
  options: TransformOptions
): Promise<string> {
  const trimmed = source.trim();
  if (!trimmed) return "";

  const codeForTerser = stripTypeScript(trimmed);
  const { outputFormat, uglify } = options;
  const beautify = outputFormat === "formatted";

  try {
    const result = await terserMinify(codeForTerser, {
      compress: uglify ? {} : false,
      mangle: uglify,
      format: {
        beautify,
        comments: false,
      },
    });
    if (result.code == null) return codeForTerser;
    return result.code;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "변환 중 오류가 발생했습니다.";
    throw new Error(message);
  }
}
