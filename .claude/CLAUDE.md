# CLAUDE

> 기반(foundation) 구축 진행 중. 컨벤션 SSOT(`docs/references/`)와 완전한 인덱스는
> Task 9에서 작성됩니다. 그 전까지 이 파일은 최소 상태로 둡니다.

## 이 프로젝트 핵심 규칙 (요약)

- 개인 사이트 프론트엔드. 스택: Next.js(App Router) · React 19 + React Compiler · TypeScript · pnpm.
- 디자인: **PPOS 커스텀 토큰 + CSS Modules**. **Tailwind·Astryx 사용 안 함.** raw hex/px 금지 — CSS 변수 토큰만.
- 데이터: **RSC-first** 서버 fetch. 콘텐츠는 `api.raven.kr`(계약: `docs/api-contract/content-v1.md`).
- 아키텍처: `app → features → components → 하위 공용`. no-barrel, path alias, `import type`, 역방향 import 금지.
- 애니메이션은 `motion`(`motion/react`). 토스트는 `@lib/toast`만(sonner 직접 import 금지).
- 커밋: Conventional Commits(자연어 한국어).

## 참고 문서
- 설계 spec: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md`
- 구현 계획: `docs/superpowers/plans/2026-07-06-personal-site-foundation.md`
