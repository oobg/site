import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { CodeDiffView } from "@/features/code-diff";
import { ROUTES } from "@/shared/config/routes";
import { motionEnter } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/Button";

export function CodeDiffPage() {
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

          <p className="leading-relaxed text-muted-foreground">
            원본과 수정본 텍스트를 입력한 뒤 변환 버튼을 누르면 차이를
            계산합니다. 결과는 한 페이지(unified) 또는 두 페이지(side-by-side)
            탭으로 볼 수 있습니다.
          </p>

          <CodeDiffView />
        </motion.section>
      </div>
    </>
  );
}
