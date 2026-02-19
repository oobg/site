import type { TriadicPalette } from "@/shared/lib/triadicColorGenerator";

type MainPalettePreviewProps = { palette: TriadicPalette };

export function MainPalettePreview({ palette }: MainPalettePreviewProps) {
  return (
    <div className="space-y-6 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">
        Primary / Secondary / Tertiary
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Primary</p>
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
  );
}
