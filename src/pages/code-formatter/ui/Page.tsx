import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { FormatterView } from "@/features/code-formatter";
import { ROUTES } from "@/shared/config/routes";
import { motionEnter } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/Button";

export function CodeFormatterPage() {
  return (
    <>
      <Helmet>
        <title>코드 정렬 · raven</title>
        <meta
          name="description"
          content="HTML, CSS, JS, JSX, SQL 코드를 선택한 언어에 맞게 포맷합니다."
        />
      </Helmet>
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              코드 정렬
            </h1>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.PROJECTS_LIST}>Projects</Link>
            </Button>
          </div>

          <p className="leading-relaxed text-muted-foreground">
            HTML, CSS, JavaScript, JSX, SQL 중 언어를 선택하고 코드를 입력한 뒤
            정렬 버튼을 누르면 포맷된 결과를 볼 수 있습니다. 결과는 복사할 수
            있습니다.
          </p>

          <FormatterView />
        </motion.section>
      </div>
    </>
  );
}
