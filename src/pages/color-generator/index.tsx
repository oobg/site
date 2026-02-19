import { motion } from "framer-motion";
import { Copy, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { useThemeStore } from "@/features/theme";
import { ROUTES } from "@/shared/config/routes";
import { toast } from "@/shared/lib/toast";
import {
  type ColorScale,
  generateTriadicPalette,
  getRandomSeedHex,
  type TriadicPalette,
} from "@/shared/lib/triadic-color-generator";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";

const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

const SCALE_KEYS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const DEFAULT_SEED_HEX = "#7c3aed";

type SeedMode = "random" | "picker";
type SeedTone = "light" | "dark";

/** 컬러 피커용 #rrggbb 반환 (짧은 hex는 확장, 잘못된 값은 기본값) */
function toPickerHex(hex: string): string {
  const s = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(s)) return "#" + s.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(s))
    return "#" + [...s].map((c) => c + c).join("").toLowerCase();
  return DEFAULT_SEED_HEX;
}

function scaleToCssVars(
  scale: { primary: ColorScale; secondary: ColorScale; tertiary: ColorScale },
  prefix: string,
  lineIndent = "  "
): string {
  const lines: string[] = [];
  for (const [name, s] of [
    ["primary", scale.primary],
    ["secondary", scale.secondary],
    ["tertiary", scale.tertiary],
  ] as const) {
    for (const key of SCALE_KEYS) {
      lines.push(`${lineIndent}--${name}-${key}: ${s[key]};`);
    }
  }
  return `${prefix} {\n${lines.join("\n")}\n}`;
}

function ScaleRow({
  label,
  scale,
}: {
  label: string;
  scale: ColorScale;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {SCALE_KEYS.map((key) => (
          <div
            key={key}
            className="flex flex-col items-center gap-0.5"
            title={scale[key]}
          >
            <div
              className="size-8 rounded border border-border sm:size-10"
              style={{ backgroundColor: scale[key] }}
            />
            <span className="text-[10px] text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        {SCALE_KEYS.map((key) => (
          <code key={key} className="rounded bg-muted px-1 py-0.5">
            {scale[key]}
          </code>
        ))}
      </div>
    </div>
  );
}

function ScaleCopyButtons({ seed }: { seed: string | undefined }) {
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

export function ColorGeneratorPage() {
  const effectiveTheme = useThemeStore((s) => s.effectiveTheme);
  const darkMode = effectiveTheme === "dark";

  const [seedMode, setSeedMode] = useState<SeedMode>("random");
  const [seedTone, setSeedTone] = useState<SeedTone>("light");
  const [hexInput, setHexInput] = useState("");

  const palette = useMemo<TriadicPalette>(() => {
    const seed = hexInput.trim() || undefined;
    try {
      return generateTriadicPalette(seed, { darkMode });
    } catch {
      return generateTriadicPalette(undefined, { darkMode });
    }
  }, [hexInput, darkMode]);

  return (
    <>
      <Helmet>
        <title>컬러 스케일 생성기 · raven</title>
        <meta
          name="description"
          content="OKLCH Triadic(±120°) 기반 컬러 스케일 생성기. Primary / Secondary / Tertiary 및 100~900 스케일."
        />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              컬러 스케일 생성기
            </h1>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.PROJECTS_LIST}>Projects</Link>
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <h2 className="font-medium text-foreground">이 도구에 대해</h2>
            <p className="leading-relaxed">
              시드 색 하나를 넣으면 OKLCH 색공간에서 Triadic(서로 120도 차이 나는
              세 hue)로 primary, secondary, tertiary 세 가지 메인 색을 만들어 줍니다.
              채도는 10% 줄이고, 밝기는 0.45~0.75 구간으로 맞춘 뒤 WCAG 대비를
              만족하도록 조정합니다. 다크 모드에서는 밝기를 반대로 재매핑한 뒤 다시
              대비를 검사합니다.
            </p>
            <p className="leading-relaxed">
              시드를 비우면 기본 보라 계열 색으로 같은 방식이 적용됩니다. 아래
              탭에서 랜덤 시드 생성(밝은/어두운 계열 선택 후 생성) 또는 컬러
              피커로 시드 색을 고를 수 있고, 선택한 시드로 Triadic 팔레트가
              만들어집니다.
            </p>
            <p className="leading-relaxed">
              메인 세 색 각각에 대해 100부터 900까지 아홉 단계 스케일을 만들며,
              hue와 채도는 그대로 두고 밝기만 단계별로 바꿉니다.
            </p>
          </div>

          <div className="space-y-4">
            <div
              role="tablist"
              aria-label="시드 생성 방식"
              className="flex gap-0 rounded-lg border border-border bg-muted/30 p-0.5 w-fit"
            >
              <button
                type="button"
                role="tab"
                aria-selected={seedMode === "random"}
                aria-controls="seed-panel-random"
                id="tab-random"
                onClick={() => setSeedMode("random")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  seedMode === "random"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                랜덤 시드
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={seedMode === "picker"}
                aria-controls="seed-panel-picker"
                id="tab-picker"
                onClick={() => setSeedMode("picker")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  seedMode === "picker"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                컬러 피커
              </button>
            </div>

            {seedMode === "random" && (
              <div
                id="seed-panel-random"
                role="tabpanel"
                aria-labelledby="tab-random"
                className="flex flex-wrap items-end gap-3"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="seed-tone"
                    className="text-sm font-medium"
                  >
                    계열 (화이트 모드 기준)
                  </label>
                  <Select
                    id="seed-tone"
                    value={seedTone}
                    onChange={(e) =>
                      setSeedTone(e.target.value as SeedTone)
                    }
                    className="w-auto min-w-[10rem]"
                  >
                    <option value="light">밝은 계열</option>
                    <option value="dark">어두운 계열</option>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    setHexInput(getRandomSeedHex(seedTone))
                  }
                  className="inline-flex items-center gap-1.5"
                >
                  <Sparkles className="size-4" aria-hidden />
                  생성
                </Button>
                {hexInput && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>현재 시드</span>
                    <span
                      className="inline-block size-5 rounded border border-border"
                      style={{ backgroundColor: hexInput }}
                      aria-hidden
                    />
                    <code className="font-mono text-xs">{hexInput}</code>
                  </div>
                )}
              </div>
            )}

            {seedMode === "picker" && (
              <div
                id="seed-panel-picker"
                role="tabpanel"
                aria-labelledby="tab-picker"
                className="flex flex-wrap items-end gap-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="seed-color-picker"
                    className="text-sm font-medium"
                  >
                    시드 색 (컬러 피커)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="seed-color-picker"
                      type="color"
                      value={toPickerHex(hexInput)}
                      onChange={(e) => setHexInput(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-input bg-transparent p-0"
                      aria-describedby="picker-hint"
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {toPickerHex(hexInput)}
                    </span>
                  </div>
                  <p
                    id="picker-hint"
                    className="text-xs text-muted-foreground"
                  >
                    색을 고르면 그 색을 시드로 Triadic 팔레트가 생성됩니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="hex-seed" className="text-sm font-medium">
                    시드 HEX (직접 입력)
                  </label>
                  <Input
                    id="hex-seed"
                    type="text"
                    placeholder="#7c3aed 또는 비워두기"
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    className="max-w-xs font-mono"
                    aria-describedby="hex-hint"
                  />
                  <p
                    id="hex-hint"
                    className="text-xs text-muted-foreground"
                  >
                    비우면 기본 시드색으로 표시됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 border-t border-border pt-6">
            <h2 className="text-lg font-semibold">Primary / Secondary / Tertiary</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Primary
                </p>
                <div
                  className="h-24 rounded-lg border border-border"
                  style={{ backgroundColor: palette.primary }}
                />
                <code className="block truncate text-xs text-muted-foreground">
                  {palette.primary}
                </code>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Secondary
                </p>
                <div
                  className="h-24 rounded-lg border border-border"
                  style={{ backgroundColor: palette.secondary }}
                />
                <code className="block truncate text-xs text-muted-foreground">
                  {palette.secondary}
                </code>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Tertiary
                </p>
                <div
                  className="h-24 rounded-lg border border-border"
                  style={{ backgroundColor: palette.tertiary }}
                />
                <code className="block truncate text-xs text-muted-foreground">
                  {palette.tertiary}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-6 border-t border-border pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">스케일 100 ~ 900</h2>
              <ScaleCopyButtons seed={hexInput.trim() || undefined} />
            </div>
            <div className="space-y-8">
              <ScaleRow label="Primary" scale={palette.scale.primary} />
              <ScaleRow label="Secondary" scale={palette.scale.secondary} />
              <ScaleRow label="Tertiary" scale={palette.scale.tertiary} />
            </div>
          </div>
        </motion.section>
      </div>
    </>
  );
}
