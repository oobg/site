# 프로젝트 목록 + 상세 설계

> 상태: **합의됨**. `/projects` 목록과 `/projects/[slug]` 상세를 블로그 읽기 경험 패턴을 재사용해 구현.
> 선행 설계: `2026-07-06-blog-reading-experience-design.md`, `2026-07-06-personal-site-foundation-design.md`.
> 계약 SSOT: `docs/api-contract/content-v2.md`.

## 목표

- `/projects` — 프로젝트 카드 그리드(포트폴리오형).
- `/projects/[slug]` — 헤더 메타 + 단일 칼럼 본문 + 이전/다음 네비.
- 블로그 마일스톤 패턴(서비스 계층·마크다운 렌더·정적 생성·NFC 디코딩)을 최대한 재사용.
- 프로젝트 고유 필드(role·period·stack·links)는 `frontmatter{}`로 소비(계약 v2 §스키마).

## 계약상 전제 (중요)

- **목록 item(`ContentListItem`)에는 `frontmatter`가 없다.** `role·stack` 등 고유 필드는 **상세(`ContentDetail`)에만** 존재.
  - → 목록 카드는 `cover_image_url·title·summary·tags`만 사용. stack 칩은 상세 헤더에서만.
- slug는 유니코드(한글) 허용. 정적 생성 시 percent-encoded params → 페이지에서 `decodeURIComponent(slug).normalize('NFC')` 필수.
- `cover_image_url`은 절대 URL(GitHub raw) 또는 `null`.

## 재사용 / 변경 없음

`features/projects/` 서비스 계층은 이미 블로그와 대칭으로 완성 — **수정 없이 그대로 사용**:

- `features/projects/types/projects.types.ts` — `ProjectListItem`, `Project`, `ProjectFrontmatter`.
- `features/projects/services/projects.api.ts` — `getProjects()`, `getProject()` (mock↔api 어댑터, `server-only`).
- `features/projects/services/projects.query.ts` — queryOptions(정의만).
- `features/projects/fixtures/projects.mock.ts` — mock 데이터.

`lib/markdown/render.ts`(`renderMarkdown`)·`lib/metadata/metadata.ts`(`buildMetadata`)·`constants/routes.ts`(`ROUTES.PROJECTS.*`)도 그대로.

## 공용 승격

**`ArticleBody`를 블로그 page-local → 공용 컴포넌트로 승격.**

- 이동: `app/blog/[slug]/_components/ArticleBody.tsx`(+`.module.css`) → `components/content/ArticleBody.tsx`(+`.module.css`).
- 블로그 상세(`app/blog/[slug]/page.tsx`)의 import 경로 갱신.
- 근거: 마크다운 본문을 블로그·프로젝트가 공유. 아키텍처 문서(§페이지 패턴)의 "`_components`는 공유 시 `components/`로 승격" 원칙. 프로젝트 상세가 블로그 `_components`를 교차 import하는 냄새 방지.
- `ArticleBody`는 `dangerouslySetInnerHTML` 한 줄 래퍼 + prose 스타일 — 로직 변경 없이 위치만 이동.

## 목록 `/projects`

### `app/projects/page.tsx` (RSC)

- `getProjects({ sort: '-published_at' })`로 목록 fetch.
- 헤더(`h1` "프로젝트") + `ProjectCard` 카드 그리드.
- 빈 상태: "아직 프로젝트가 없어요."
- `metadata = buildMetadata({ title:'프로젝트', description:…, path: ROUTES.PROJECTS.LIST })`.
- **태그 필터 없음** (프로젝트 수가 적음. 추후 필요 시 블로그 `TagFilter` 패턴으로 추가).

### `app/projects/projects.module.css`

- 헤더 스타일(블로그 `blog.module.css` 미러링: `--space-9` padding-top 등).
- 그리드: 2열(`grid-template-columns`), gap `--space-6`, `--w-container`. 모바일 1열 폴백(`@media`).

### `features/projects/components/ProjectCard.tsx` (+`.module.css`)

- props: `{ project: ProjectListItem }`.
- 구조: cover 영역 + title + summary(있으면) + tag 칩.
  - cover: `cover_image_url`이 있으면 `<img loading="lazy" alt={title}>`, 없으면 토큰 기반 플레이스홀더 블록(`--color-border`/`--color-canvas` 계열, 외부 asset 없음).
  - next/image remotePatterns 설정 회피를 위해 plain `<img>` 사용.
- 전체 카드 링크: `ROUTES.PROJECTS.DETAIL(project.slug)`.
- hover: design-language 모션 규칙(`translateY(2px)`, `--dur`), `prefers-reduced-motion` 존중.
- 색: accent는 interaction 전용 규칙 준수(브랜딩 색 아님).

## 상세 `/projects/[slug]`

### `app/projects/[slug]/page.tsx` (RSC)

- `export const dynamicParams = true`.
- `generateStaticParams()` — `getProjects()` → `{ slug }[]`.
- `generateMetadata({ params })` — `decodeURIComponent(slug).normalize('NFC')` → `getProject(key)` → `buildMetadata(title, summary, ROUTES.PROJECTS.DETAIL(slug))`.
- 본문: `getProject(key)` → `renderMarkdown(body_markdown)` → `{ html }` (TOC는 사용 안 함).
- prev/next: `getProjects({ sort:'-published_at' })`에서 index 계산(블로그 상세와 동일 로직).
- 렌더: 단일 칼럼. `ProjectHeader` + `ArticleBody(html)` + `ProjectNav(prev,next)`.

### `app/projects/[slug]/project.module.css`

- reading-width(`--w-reading`) 단일 칼럼. 블로그의 2단(`article + aside`) 아님.

### `_components/ProjectHeader.tsx` (+`.module.css`)

- props: `{ project: Project }`.
- `const fm = project.frontmatter as ProjectFrontmatter`.
- 렌더: title(`h1`) + 메타 영역.
  - 메타 행: 날짜(`published_at`, `formatDate` ISO 10자리). reading time은 **표시하지 않음**(프로젝트는 읽기 분량보다 개요 성격 — 블로그 `ArticleHeader`와의 차이점).
  - `role` — 있으면 표시.
  - `period` — 있으면 표시.
  - `stack` — 있으면 칩 목록.
  - `links` — `repo`/`live` 각각 있으면 외부 링크(`<a target="_blank" rel="noreferrer">`).
- 누락 필드는 조건부 렌더(생략). 모든 고유 필드가 optional임을 전제.

### `_components/ProjectNav.tsx` (+`.module.css`)

- props: `{ prev: ProjectListItem | null; next: ProjectListItem | null }`.
- `PostNav` 구조 미러링하되 `ROUTES.PROJECTS.DETAIL`, 라벨 "이전 프로젝트"/"다음 프로젝트".
- 둘 다 null이면 `null` 반환.
- PostNav가 `ROUTES.BLOG`를 하드코딩하므로 공용화 대신 소규모 복제(과도한 추상화 회피).

## 테스트 (TDD)

블로그 컴포넌트 테스트(`PostRow.test`, `TagFilter.test`) 미러링. 초점 유지:

- `features/projects/components/__tests__/ProjectCard.test.tsx`
  - title·summary·tag 칩 렌더.
  - cover 있을 때 `<img>`, 없을 때 플레이스홀더.
  - 상세 링크 href = `/projects/<slug>`.
- `app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx`
  - role·period·stack·links 모두 있는 케이스 렌더.
  - 누락 필드 생략(예: links 없으면 링크 미렌더).
- `ProjectNav` — PostNav에 테스트가 없는 것과 대칭으로 생략(간단해 회귀 위험 낮음). 필요 시 추가.

## 스코프 밖

- 글로벌 네비/헤더(`/projects` 링크 노출) — 현재 사이트에 글로벌 nav 없음(블로그도 동일). 별도 마일스톤.
- 홈(랜딩)에 프로젝트 섹션 노출.
- 프로젝트 목록 태그 필터·페이지네이션.
- next/image 최적화(remotePatterns 설정) — plain `<img>`로 시작.
- 다크모드(PPOS 헌장 범위 밖).

## 파일 요약

**신규**

- `app/projects/page.tsx`, `app/projects/projects.module.css`
- `app/projects/[slug]/page.tsx`, `app/projects/[slug]/project.module.css`
- `app/projects/[slug]/_components/ProjectHeader.tsx` (+css)
- `app/projects/[slug]/_components/ProjectNav.tsx` (+css)
- `app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx`
- `features/projects/components/ProjectCard.tsx` (+css)
- `features/projects/components/__tests__/ProjectCard.test.tsx`
- `components/content/ArticleBody.tsx` (+css) — 블로그에서 이동

**변경**

- `app/blog/[slug]/page.tsx` — `ArticleBody` import 경로 갱신.

**삭제**

- `app/blog/[slug]/_components/ArticleBody.tsx` (+css) — 승격으로 이동.
