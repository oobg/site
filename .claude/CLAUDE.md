# CLAUDE

프로젝트 컨벤션의 **진실 원천은 `docs/references/`** 입니다. 이 파일은 링크 인덱스입니다.

## 컨벤션 (SSOT: docs/references/)

- [아키텍처](../docs/references/architecture.md) — 레이어·import·페이지 패턴·ROUTES
- [상태 모델](../docs/references/state-model.md) — 4종 상태·폼·Toast·안티패턴
- [디자인 언어](../docs/references/design-language.md) — PPOS 토큰·모션·색
- [콘텐츠 API](../docs/references/content-api.md) — 소비 규칙

## 계약·설계

- [API 계약(참조 사본)](../docs/api-contract/content-v2.md) — 원본은 api repo
- [기반 설계 spec](../docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md)

## 규칙 요약

- pnpm · no-barrel · path alias · RSC-first · CSS 토큰만(Tailwind 금지) · sonner는 @lib/toast만
- 커밋: Conventional Commits(자연어 한국어)
- 게이트: `typecheck` · `lint` · `test` · `check:css`(정의 없는 클래스 참조) ·
  `check:design`(라우트 좌우 여백 · 섹션 레이블 한글 · 토큰 밖 색)
- **토큰 값을 바꾸면 `docs/references/design-language.md`를 같은 커밋에서 고친다.**
  SSOT가 코드와 갈라진 채로 두면 다음 세션이 문서를 믿고 이미 고친 것을 되돌린다.
