import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import {
  motionEnter,
  ScaleCopyButtons,
  ScaleRow,
  type SeedMode,
  type SeedTone,
  toPickerHex,
} from "@/features/color-generator";
import { useThemeStore } from "@/features/theme";
import { ROUTES } from "@/shared/config/routes";
import {
  generateTriadicPalette,
  getRandomSeedHex,
  type TriadicPalette,
} from "@/shared/lib/triadicColorGenerator";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

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
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setHexInput(e.target.value)}
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setHexInput(e.target.value)}
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
