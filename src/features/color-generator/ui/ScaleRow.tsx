import type { ColorScale } from "@/shared/lib/triadicColorGenerator";

import { SCALE_KEYS } from "../lib/constants";

export function ScaleRow({
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
        {SCALE_KEYS.map(key => (
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
        {SCALE_KEYS.map(key => (
          <code key={key} className="rounded bg-muted px-1 py-0.5">
            {scale[key]}
          </code>
        ))}
      </div>
    </div>
  );
}
