import { useMemo, useState } from "react";

import { useThemeStore } from "@/features/theme";
import {
  generateTriadicPalette,
  type TriadicPalette,
} from "@/shared/lib/triadicColorGenerator";

import type { SeedMode, SeedTone } from "../lib/constants";
import { MainPalettePreview } from "./MainPalettePreview";
import { ScaleCopyButtons } from "./ScaleCopyButtons";
import { ScaleRow } from "./ScaleRow";
import { SeedPanel } from "./SeedPanel";

export function ColorGeneratorView() {
  const effectiveTheme = useThemeStore(s => s.effectiveTheme);
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
      <SeedPanel
        hexInput={hexInput}
        setHexInput={setHexInput}
        seedMode={seedMode}
        setSeedMode={setSeedMode}
        seedTone={seedTone}
        setSeedTone={setSeedTone}
      />

      <MainPalettePreview palette={palette} />

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
    </>
  );
}
