import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { MinifyView } from "@/features/code-minify";
import { ROUTES } from "@/shared/config/routes";
import { motionEnter } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/Button";

export function CodeMinifyPage() {
  return (
    <>
      <Helmet>
        <title>코드 압축·난독화 · raven</title>
        <meta
          name="description"
          content="JavaScript 코드를 포매팅하거나 한 줄로 압축하고, uglify로 변수명을 짧게 할 수 있습니다. 결과는 복사할 수 있습니다."
        />
      </Helmet>
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              코드 압축·난독화
            </h1>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.PROJECTS_LIST}>Projects</Link>
            </Button>
          </div>

          <p className="leading-relaxed text-muted-foreground">
            원본 JavaScript를 입력한 뒤 출력 형식(포매팅/한줄)과 uglify 여부를
            선택하고 변환하면 결과를 볼 수 있습니다. 결과는 복사할 수 있습니다.
          </p>

          <MinifyView />
        </motion.section>
      </div>
    </>
  );
}
