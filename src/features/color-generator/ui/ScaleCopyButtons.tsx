import { Copy } from "lucide-react";
import { useCallback } from "react";

import { generateTriadicPalette } from "@/shared/lib/triadicColorGenerator";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/Button";

import { scaleToCssVars } from "../lib/utils";

export function ScaleCopyButtons({ seed }: { seed: string | undefined }) {
  const copyAsJson = useCallback(() => {
    const light = generateTriadicPalette(seed, { darkMode: false });
    const dark = generateTriadicPalette(seed, { darkMode: true });
    const payload = {
      light: {
        primary: light.scale.primary,
        secondary: light.scale.secondary,
        tertiary: light.scale.tertiary,
      },
      dark: {
        primary: dark.scale.primary,
        secondary: dark.scale.secondary,
        tertiary: dark.scale.tertiary,
      },
    };
    const text = JSON.stringify(payload, null, 2);
    void navigator.clipboard.writeText(text).then(() => {
      toast.success("JSON이 클립보드에 복사되었습니다.");
    });
  }, [seed]);

  const copyAsCss = useCallback(() => {
    const light = generateTriadicPalette(seed, { darkMode: false });
    const dark = generateTriadicPalette(seed, { darkMode: true });
    const rootBlock = scaleToCssVars(light.scale, ":root");
    const darkRootBlock = scaleToCssVars(dark.scale, "  :root", "    ");
    const darkBlock = `@media (prefers-color-scheme: dark) {\n${darkRootBlock}\n}`;
    const text = `${rootBlock}\n\n${darkBlock}`;
    void navigator.clipboard.writeText(text).then(() => {
      toast.success("CSS :root(라이트/다크)가 클립보드에 복사되었습니다.");
    });
  }, [seed]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copyAsJson}
        className="inline-flex items-center gap-1.5"
      >
        <Copy className="size-3.5" aria-hidden />
        JSON 복사
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copyAsCss}
        className="inline-flex items-center gap-1.5"
      >
        <Copy className="size-3.5" aria-hidden />
        CSS :root 복사
      </Button>
    </div>
  );
}
