import { Sparkles } from "lucide-react";
import { type ChangeEvent } from "react";

import { getRandomSeedHex } from "@/shared/lib/triadicColorGenerator";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

import type { SeedMode, SeedTone } from "../lib/constants";
import { toPickerHex } from "../lib/utils";

type SeedPanelProps = {
  hexInput: string;
  setHexInput: (v: string) => void;
  seedMode: SeedMode;
  setSeedMode: (v: SeedMode) => void;
  seedTone: SeedTone;
  setSeedTone: (v: SeedTone) => void;
};

export function SeedPanel({
  hexInput,
  setHexInput,
  seedMode,
  setSeedMode,
  seedTone,
  setSeedTone,
}: SeedPanelProps) {
  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="시드 생성 방식"
        className="flex w-fit gap-0 rounded-lg border border-border bg-muted/30 p-0.5"
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
            <label htmlFor="seed-tone" className="text-sm font-medium">
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
            onClick={() => setHexInput(getRandomSeedHex(seedTone))}
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
            <label htmlFor="seed-color-picker" className="text-sm font-medium">
              시드 색 (컬러 피커)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="seed-color-picker"
                type="color"
                value={toPickerHex(hexInput)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setHexInput(e.target.value)
                }
                className="h-10 w-14 cursor-pointer rounded border border-input bg-transparent p-0"
                aria-describedby="picker-hint"
              />
              <span className="font-mono text-sm text-muted-foreground">
                {toPickerHex(hexInput)}
              </span>
            </div>
            <p id="picker-hint" className="text-xs text-muted-foreground">
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
                setHexInput(e.target.value)
              }
              className="max-w-xs font-mono"
              aria-describedby="hex-hint"
            />
            <p id="hex-hint" className="text-xs text-muted-foreground">
              비우면 기본 시드색으로 표시됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
