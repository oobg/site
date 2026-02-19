import { ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";

import { computeLineDiff } from "../lib/diff";
import { DiffView } from "./DiffView";
import { OriginalModifiedInputs } from "./OriginalModifiedInputs";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";

export type OutputViewMode = "unified" | "side-by-side";

export function CodeDiffView() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [outputView, setOutputView] = useState<OutputViewMode>("unified");
  const [hasRun, setHasRun] = useState(false);

  const changes = useMemo(() => {
    if (!hasRun) return [];
    return computeLineDiff(original, modified);
  }, [original, modified, hasRun]);

  return (
    <>
      <OriginalModifiedInputs
        original={original}
        modified={modified}
        onOriginalChange={setOriginal}
        onModifiedChange={setModified}
      />

      <Button
        type="button"
        onClick={() => setHasRun(true)}
        className="inline-flex items-center gap-1.5"
      >
        <ArrowRightLeft className="size-4" aria-hidden />
        변환
      </Button>

      {hasRun && (
        <div className="space-y-4 border-t border-border pt-6">
          <div
            role="tablist"
            aria-label="출력 보기"
            className="flex w-fit gap-0 rounded-lg border border-border bg-muted/30 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={outputView === "unified"}
              aria-controls="output-panel-unified"
              id="tab-unified"
              onClick={() => setOutputView("unified")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                outputView === "unified"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              한 페이지
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={outputView === "side-by-side"}
              aria-controls="output-panel-side"
              id="tab-side"
              onClick={() => setOutputView("side-by-side")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                outputView === "side-by-side"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              두 페이지
            </button>
          </div>

          <div
            id={
              outputView === "unified"
                ? "output-panel-unified"
                : "output-panel-side"
            }
            role="tabpanel"
            aria-labelledby={
              outputView === "unified" ? "tab-unified" : "tab-side"
            }
          >
            <DiffView changes={changes} mode={outputView} />
          </div>
        </div>
      )}
    </>
  );
}
