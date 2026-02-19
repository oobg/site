import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { ColorGeneratorView } from "@/features/color-generator";
import { ROUTES } from "@/shared/config/routes";
import { motionEnter } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/Button";

export function ColorGeneratorPage() {
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
              시드 색 하나를 넣으면 OKLCH 색공간에서 Triadic(서로 120도 차이
              나는 세 hue)로 primary, secondary, tertiary 세 가지 메인 색을
              만들어 줍니다. 채도는 10% 줄이고, 밝기는 0.45~0.75 구간으로 맞춘
              뒤 WCAG 대비를 만족하도록 조정합니다. 다크 모드에서는 밝기를
              반대로 재매핑한 뒤 다시 대비를 검사합니다.
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

          <ColorGeneratorView />
        </motion.section>
      </div>
    </>
  );
}
