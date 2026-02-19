import { motion } from "framer-motion";
import { ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import {
  computeLineDiff,
  DiffView,
  OriginalModifiedInputs,
} from "@/features/code-diff";
import { ROUTES } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";

const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

type OutputView = "unified" | "side-by-side";

export function CodeDiffPage() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [outputView, setOutputView] = useState<OutputView>("unified");
  const [hasRun, setHasRun] = useState(false);

  const changes = useMemo(() => {
    if (!hasRun) return [];
    return computeLineDiff(original, modified);
  }, [original, modified, hasRun]);

  const runDiff = () => setHasRun(true);

  return (
    <>
      <Helmet>
        <title>코드 비교 · raven</title>
        <meta
          name="description"
          content="원본과 수정본 텍스트를 입력하고 비교합니다. 한 페이지(unified) 또는 두 페이지(side-by-side)로 결과를 볼 수 있습니다."
        />
      </Helmet>
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              코드 비교
            </h1>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.PROJECTS_LIST}>Projects</Link>
            </Button>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            원본과 수정본 텍스트를 입력한 뒤 변환 버튼을 누르면 차이를 계산합니다.
            결과는 한 페이지(unified) 또는 두 페이지(side-by-side) 탭으로 볼 수 있습니다.
          </p>

          <OriginalModifiedInputs
            original={original}
            modified={modified}
            onOriginalChange={setOriginal}
            onModifiedChange={setModified}
          />

          <Button
            type="button"
            onClick={runDiff}
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
                className="flex gap-0 rounded-lg border border-border bg-muted/30 p-0.5 w-fit"
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
                id={outputView === "unified" ? "output-panel-unified" : "output-panel-side"}
                role="tabpanel"
                aria-labelledby={outputView === "unified" ? "tab-unified" : "tab-side"}
              >
                <DiffView changes={changes} mode={outputView} />
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </>
  );
}
