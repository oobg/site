# 글로벌 nav 설계

> 상태: **합의됨**. 모든 페이지 상단에 글로벌 nav(SiteHeader)를 두고, 기존 footer를 전역화한다.
> 선행: foundation·블로그·프로젝트 마일스톤(main 머지 완료).

## 배경

- 현재 `SiteFooter`는 `layout.tsx`가 아니라 홈 `app/page.tsx`에만 수동 포함 → 블로그·프로젝트 페이지엔 footer 없음.
- 글로벌 nav가 없어 `/blog`·`/projects`로의 진입 경로가 페이지 내부 링크뿐.

## 목표

- 모든 페이지(홈·블로그 목록/상세·프로젝트 목록/상세)에 상단 nav 노출.
- nav 링크: 워드마크(→ 홈), 글(→ `/blog`), 프로젝트(→ `/projects`).
- header·footer를 `layout.tsx`에서 렌더해 전역 chrome으로 통일.

## 구조

### `app/_components/SiteHeader.tsx` (신규, 서버 컴포넌트)

- `<header>` > `Container` > `<nav>`.
- 왼쪽: 워드마크 `raven.kr` — `ROUTES.HOME` 링크.
- 오른쪽: `글`(`ROUTES.BLOG.LIST`), `프로젝트`(`ROUTES.PROJECTS.LIST`). 라벨은 각 목록 페이지 `h1`("글", "프로젝트")과 통일.
- 순수 서버 컴포넌트 — `'use client'` 없음. active 강조 없음.

### `app/layout.tsx` (수정)

- `AppProviders` 안에 `<SiteHeader />` + `{children}` + `<SiteFooter />` 순서로 배치.

### `app/_components/SiteFooter.tsx` (수정)

- 자체적으로 `Container`로 감싸도록 변경(현재는 홈 Container 안에 있어 wrapper 없음). layout 직속 배치를 위해 필요.
- 링크 내용(GitHub, API)은 유지.

### `app/page.tsx` (수정)

- 홈에서 `<SiteFooter />`와 그 import 제거(이제 전역).

## 스타일 (`SiteHeader.module.css`)

- `.header`: `border-bottom: 1px solid var(--color-border)`.
- `.nav`: `display:flex; align-items:center; justify-content:space-between; padding-block: var(--space-5)`.
- `.wordmark`: `font-family: var(--font-mono), monospace; font-size: var(--fs-15)`.
- `.links`: `display:flex; gap: var(--space-5); font-size: var(--fs-15)`.
- 링크 기본 색은 상속(text), `:hover` → `var(--color-accent)` (footer와 동일한 상호작용 패턴, 토큰만). raw hex/px 금지.

## 검증

- `SiteHeader` 렌더 스모크 테스트 1개: 홈·글·프로젝트 링크의 href가 각각 `/`, `/blog`, `/projects`인지 확인(라우트 오타 회귀 방지).
- `pnpm typecheck` + `pnpm test` + `pnpm build`(모든 라우트에 header/footer 렌더, 빌드 성공).

## 스코프 밖

- active(현재 페이지) 강조 — 서버 컴포넌트 유지를 위해 제외.
- 모바일 햄버거 메뉴·드롭다운 — 링크 2개라 불필요(YAGNI).
- 홈 랜딩의 프로젝트 섹션 노출(별도).

## 파일 요약

**신규**

- `src/app/_components/SiteHeader.tsx` (+`.module.css`)
- `src/app/_components/__tests__/SiteHeader.test.tsx`

**수정**

- `src/app/layout.tsx` — SiteHeader/SiteFooter 전역 배치
- `src/app/_components/SiteFooter.tsx` — Container wrapper 추가
- `src/app/page.tsx` — 홈에서 SiteFooter 제거
