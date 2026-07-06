# 개인 사이트 프론트엔드 — 초기 세팅(기반) 설계 v2

> 상태: 합의됨. 이 문서는 "기반(foundation)" 마일스톤의 단일 설계 기준이다.
> 상위 디자인 헌장: PPOS (Personal Product Operating System) v1.
> API 계약 SSOT: `api` repo의 `docs/api-contract/content-v1.md` (이 repo에 참조 사본을 둔다).
>
> 설계 철학: **RSC-first · CSS-token-first · no-barrel · mock-to-api · docs-as-SSOT.**
> `_container`/`_components`, `page client 금지`, feature 분리는 *절대 규칙*이 아니라
> **승격 기준이 있는 패턴**으로 둔다.

## 1. 배경과 목표

개인 사이트(랜딩 + 기술 블로그 + 포트폴리오 + 이력)를 만든다. 이번 마일스톤의 목적은
**사이트 기반 + 랜딩 1개 + 콘텐츠 read path 검증**까지다. 완성된 페이지 세트가 아니라,
얇고 검증된 기반을 만든다.

### 확정된 상위 결정

- **스택**: Next.js (App Router), TypeScript, 패키지 매니저 **pnpm**(corepack).
  기존 `package-lock.json`은 제거하고 `pnpm-lock.yaml`로 전환.
- **컴포넌트 뼈대**: Base UI(`@base-ui-components/react`) — 헤드리스/접근성 프리미티브.
  부분 애니메이션은 **`motion`**(motion.dev, 구 framer-motion. import: `motion/react`).
  모든 UI 요소는 primitive로 만들어 호출.
- **디자인**: Astryx 제거 → PPOS를 커스텀 토큰 + CSS로 직접 구현. **Tailwind 안 씀**(개인 사이트라
  커스텀 CSS가 맞다).
- **스타일링**: CSS Modules + `:root` CSS 변수(디자인 토큰).
- **데이터(RSC-first)**: 읽기 전용 정적 콘텐츠는 **RSC 서버 fetch로 직접 렌더**. TanStack Query는
  설치·Provider까지만 두고 **실제 사용은 검색/필터/폼/무한스크롤이 생길 때**로 미룬다.
- **배포**: 자가 홈서버 + Cloudflare Tunnel, Next.js Node 서버(`output: 'standalone'`),
  ISR·on-demand revalidation 자체 운영. (실제 배포는 별도 마일스톤, 이번엔 설정만.)
- **폰트**: `next/font/local`로 Pretendard(주) + IBM Plex Mono(보조) 셀프호스팅.

## 2. 완료 기준 (Definition of Done)

- `pnpm dev`로 뜨고, PPOS 토큰·폰트·레이아웃이 적용된 **랜딩 Hero `/`**가 렌더된다.
- 레이어 스캐폴드·path alias·ROUTES 헬퍼가 배선돼 있다. **최소 Provider**(QueryClientProvider +
  Toaster)만 둔다.
- `content-v1.md` 계약에 맞는 **타입·mock/api 어댑터**가 있고, 기본 `mock`으로 동작하다가
  env(`CONTENT_SOURCE=api`)로 실 API에 붙는다.
- 랜딩이 데이터 계층을 **엔드투엔드로 한 번 태운다**(`getPosts({limit:1})`, RSC 서버 fetch).
- `POST /api/revalidate` 웹훅 수신부가 시크릿을 검증한다.
- **Error/SEO 기반**: `not-found`/`error`/`global-error`/`loading` + metadata 기본값 +
  `generateMetadata` 헬퍼가 있다.
- **ESLint 규칙**(절대 금지 + 권장) 및 **Husky** pre-commit(lint-staged) + commit-msg(commitlint)가
  동작한다.
- `docs/references/*`(컨벤션 SSOT)가 작성되고 `.claude/CLAUDE.md`가 이를 가리키는 인덱스로 갱신된다.
- `tsc --noEmit`, eslint, 최소 테스트(2종)가 통과한다.

### 이번에 안 넣는 것

Zustand·nuqs·RHF의 실제 사용(및 설치), 블로그 상세, 프로젝트 상세, 다크모드, 검색, RSS, OG 이미지.

## 3. 레이어 아키텍처

```text
app/ → features/ → components/ → hooks/, lib/, utils/
                             ↑
                 services/, constants/, configs/
```

- `app/`: 라우팅·레이아웃·서버 오케스트레이션만. 비즈니스 로직 금지. 얇게.
- `features/`: 기능 단위 모듈. 이번엔 `posts`, `projects`만. resume/now/about은 페이지가 커져
  API/상태/타입이 생기면 그때 feature로 승격.
- `components/`: 도메인 비종속 공용 UI(primitive).
- `hooks/`·`lib/`·`utils/`·`services/`·`constants/`·`configs/`·`stores/`·`styles/`·`types/`: 하위 공용.
- **역방향 import 금지**.

### Import 규칙

- **Barrel export 금지**(`index.ts`로 묶지 않음). 실제 파일 직접 참조.
- 깊은 상대 경로(`../../`) 대신 **path alias**(같은 폴더 `./`는 허용).
- 타입은 `import type`.

### Path Alias

```
@features/*  @components/*  @configs/*  @constants/*  @hooks/*
@lib/*  @services/*  @stores/*  @styles/*  @types/*  @utils/*  @/*
```

## 4. 디렉터리 구조

```
src/
  app/
    layout.tsx              # <html lang="ko">, 폰트 변수, <AppProviders>, 전역 셸
    page.tsx                # 랜딩 Hero (/), Server Component
    loading.tsx
    error.tsx               # 라우트 에러 바운더리 (client)
    global-error.tsx        # 루트 에러 바운더리 (client)
    not-found.tsx
    globals.css             # reset + 토큰 import
    api/revalidate/route.ts # 백엔드 → 프론트 revalidation 웹훅 수신
    _components/            # 랜딩 전용 표시 컴포넌트
      LandingHero.tsx
      LatestThinking.tsx
      SiteFooter.tsx
  components/
    providers/AppProviders.tsx  # "use client": QueryClientProvider + Toaster (최소)
    layout/Container.tsx        # 레이아웃 폭 컨테이너 (primitive)
    ui/ArrowLink.tsx            # "Read →" 화살표 링크 (primitive)
  features/
    posts/
      services/posts.api.ts     # 서버 read: getPosts/getPost (canonical)
      services/posts.query.ts   # postsQueryOptions/postQueryOptions (정의만, 사용은 이후)
      fixtures/posts.mock.ts
      types/posts.types.ts      # Post/PostListItem alias + PostFrontmatter
    projects/
      services/projects.api.ts  # 서버 read: getProjects/getProject
      services/projects.query.ts
      fixtures/projects.mock.ts
      types/projects.types.ts   # Project/ProjectListItem alias + ProjectFrontmatter
  lib/
    api/http.ts             # 서버 전용 envelope fetch 래퍼(제네릭, 캐시 태그/재검증, 에러/404)
    api/contract.types.ts   # content-v1 공통 계약 타입(Envelope/Pagination/ListItem/Detail/ListParams)
    metadata/metadata.ts    # metadata 기본값 + generateMetadata 헬퍼
    toast.ts                # Toast.success/error 래퍼 (sonner를 여기서만 import)
  configs/
    env.ts                  # 런타임 env 접근(zod 검증): CONTENT_API_BASE·CONTENT_SOURCE·REVALIDATE_SECRET
    query-client.ts         # QueryClient 기본 옵션(staleTime 등)
  constants/
    routes.ts               # ROUTES 헬퍼
  styles/
    tokens.css              # 색·타이포·spacing·레이아웃·모션 토큰 (:root)
    reset.css               # 최소 reset
docs/api-contract/content-v1.md   # api repo SSOT의 참조 사본
docs/references/            # 컨벤션 SSOT: architecture/state-model/design-language/content-api
.claude/CLAUDE.md           # docs/references/*를 가리키는 얇은 인덱스(규칙 본문 없음)
eslint.config.mjs
.husky/pre-commit .husky/commit-msg
commitlint.config.mjs
next.config.ts              # output:'standalone', images.remotePatterns
Dockerfile                  # standalone 실행 스켈레톤(corepack pnpm, 배포 마일스톤용)
```

> 빈 레이어 폴더(`hooks/`·`stores/`·`utils/` 등)는 실제 파일이 생길 때 만든다.

## 5. App Router & 페이지 패턴

`src/app`은 URL·서버 경계를 표현하는 얇은 라우팅 레이어. URL에 안 드러나는 논리 그룹은 Route Group.

**단일 규칙: page는 얇게. 데이터는 상위에서. 표시 컴포넌트는 props만.**

`_container`·`_components`는 **필요할 때만** 쓴다.

```txt
정적 페이지:
  app/page.tsx                       # 서버 진입점 (데이터 서버 fetch)
  app/_components/LandingHero.tsx    # 표시 전용

상호작용 페이지(예시, 이번 범위 밖):
  app/blog/page.tsx                  # 서버 진입점 (+ prefetch/HydrationBoundary)
  app/blog/_container/BlogContainer.tsx  # "use client" 경계
  app/blog/_components/BlogList.tsx      # 표시 전용
```

- `page.tsx`: metadata, params/searchParams, 권한/redirect/notFound, (상호작용 시) prefetch.
  기본은 Server Component(권장 — 예외는 §12).
- `_container`: 클라이언트 경계(hook·form·browser API·이벤트·store·useQuery). 상호작용 페이지에만.
- `_components`: 표시 전용. 데이터 로딩·query/mutation·전역 store 접근 지양(권장 — §12). 공유되면
  `features/<f>/components/` 또는 `components/`로 승격.

### ROUTES 헬퍼 (`constants/routes.ts`)

라우트 문자열 직접 작성 금지. `ROUTES.*`만 사용.

```ts
ROUTES.HOME;              // '/'
ROUTES.BLOG.LIST;        // '/blog'
ROUTES.BLOG.DETAIL(slug);
ROUTES.PROJECTS.LIST;
ROUTES.PROJECTS.DETAIL(slug);
```

이번 마일스톤은 HOME만 실제 사용, 나머지는 미리 정의.

## 6. 상태 모델

기준 표(문서에 박는다):

| 용도 | 저장소 | 이번 마일스톤 |
|---|---|---|
| 읽기 전용 정적 콘텐츠 | **RSC 서버 fetch** | ✅ 사용 |
| 검색·필터·폼·무한스크롤 | TanStack Query | 설치 + Provider만, 사용은 이후 |
| UI 상태 | Zustand | 이후(설치도 이후) |
| URL 상태 | nuqs | 이후(설치도 이후) |
| 폼 | react-hook-form + zod | 이후(설치도 이후) |

- 폼 컨벤션(이후): `react-hook-form` + `zod` 고정, 에러 메시지 한국어.
- 피드백은 `Toast.success`/`Toast.error`(`@lib/toast`)만. **sonner 직접 import 금지**(ESLint).
- 안티패턴: **서버 데이터를 Zustand에 복사 금지**.
- 이번엔 `AppProviders`에 **QueryClientProvider + Toaster만** 배선(최소). nuqs 어댑터·기타는 사용 시 추가.

## 7. 디자인 토큰 (PPOS → CSS 변수)

`src/styles/tokens.css`의 `:root`에 정의. 앱 코드는 raw hex/px 금지, 토큰만 참조.

### 색

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-canvas` | `#F7F7F5` | 배경 |
| `--color-surface` | `#FFFFFF` | 표면 |
| `--color-text` | `#161616` | 본문 |
| `--color-text-secondary` | `#5F5F5F` | 보조 |
| `--color-text-muted` | `#909090` | 흐림 |
| `--color-border` | `#ECEBE8` | 경계선 |
| `--color-accent` | `#1D4ED8` | 링크·hover·selection·interaction 전용 |
| `--color-accent-hover` | `#1747C0` | accent hover/active |

accent는 흰색·canvas 위 WCAG AA(≈6.3:1) 만족. 브랜딩에 안 씀.

### 타이포

스케일 `--fs-72 … --fs-13`(px→rem), 본문 18px, 읽기 폭 720px. `--font-sans`(Pretendard),
`--font-mono`(IBM Plex Mono) — `next/font/local` 주입.

### Spacing scale

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px; --space-5: 24px;
--space-6: 32px; --space-7: 48px; --space-8: 64px; --space-9: 96px; --space-10: 160px;
```

### 레이아웃

`--w-container 1280 / --w-content 960 / --w-reading 720 / --w-hero 640`, `--grid-cols 12`,
`--radius 16`. gap/outer/section-gap은 spacing scale로 표현(예: outer=`--space-8`~, section=`--space-10`).

### 모션

`--dur 200ms`. hover opacity 95→100, card `translateY(2px)`, page fade+12px. parallax·과한 모션 없음.
`motion`은 이 규칙 안에서만. `prefers-reduced-motion` 존중.

### 스코프 밖

다크모드는 PPOS 헌장에 없어 이번 범위 밖(토큰 단일 값, 추후 토큰 레이어만 확장).

## 8. 데이터 계층 (계약 기반, server-read-first)

> posts/projects는 **별도 피처**. 계약 셰이프가 동일하므로 **공통 계약 타입·fetch 래퍼만 `lib/api`
> 공유**, 나머지는 각 피처가 독립.

### 공통 계약 타입 (`lib/api/contract.types.ts`) — `content-v1.md` 미러

```ts
export interface Envelope<T> {
  data: T;
  meta: { requestId: string; serverTime: string; pagination?: Pagination };
}
export interface Pagination { total: number; page: number; limit: number; }
export interface ApiErrorBody { error: { code: string; message: string }; meta: unknown; }
export interface ContentListItem {
  slug: string; title: string; summary: string; tags: string[];
  published_at: string; updated_at: string;      // ISO8601 UTC
  cover_image_url: string | null; reading_time_min?: number;
  status: "published";
}
export interface ContentDetail extends ContentListItem {
  body_markdown: string; frontmatter: Record<string, unknown>;
}
export interface ListParams {
  tag?: string; page?: number; limit?: number;
  sort?: "-published_at" | "published_at" | "-updated_at" | "updated_at" | "title";
}
```

frontmatter 헬퍼는 **피처별**: `PostFrontmatter{ date?, cover? }`,
`ProjectFrontmatter{ role?, period?, stack?[], links?{repo?,live?} }`.

### 서버 fetch 래퍼 (`lib/api/http.ts`)

- `import 'server-only'`. 베이스 URL `@configs/env`의 `CONTENT_API_BASE`(기본 `https://api.raven.kr`).
- `next: { tags, revalidate }`. 태그: 목록 `posts`/`projects`, 상세 `post:<slug>`/`project:<slug>`.
- envelope 언랩 → `data`. HTTP 404 → `notFound()`. 그 외 실패 → throw. 기본 revalidate 3600s.

### 피처별 read 함수 (canonical) + mock/api 어댑터

- `posts.api.ts`: `getPosts/getPost`. `projects.api.ts`: `getProjects/getProject`.
- `@configs/env`의 `CONTENT_SOURCE`(`mock`|`api`, 기본 `mock`)로 분기:
  `mock` → 각 피처 `fixtures/*.mock.ts`, `api` → `lib/api/http.ts`. 백엔드 준비 후 env만 스왑.
- 정적 RSC 페이지는 이 함수를 서버에서 직접 호출.

### queryOptions (`*.query.ts`)

`postsQueryOptions`/`projectQueryOptions` 등 정의만. 실제 사용은 상호작용 페이지 등장 시.
주의: `*.api.ts`는 `server-only`라 클라이언트 번들 불가 — 클라이언트 재요청이 필요한 페이지가 생기면
그 queryFn은 클라이언트 안전 경로(공개 API 직접 호출 또는 Route Handler 프록시)를 쓴다.

## 9. revalidate 라우트 (`app/api/revalidate/route.ts`)

```
POST /api/revalidate
Header: X-Revalidate-Secret: <REVALIDATE_SECRET>
Body:   { "changed": [{ "type": "post"|"project", "slug": "..." }] }
```

시크릿 불일치 → 401. 각 항목 `revalidateTag('post:'+slug)` 등 + 목록 태그 무효화.
200 `{ revalidated: true, count }`. `changed`가 비면 목록 태그만.

## 10. 대표 페이지: 랜딩 Hero (`/`)

PPOS 랜딩 원칙의 **정적 수직 슬라이스**(RSC), `app/_components/`에 표시 컴포넌트:

- `LandingHero`: 큰 타이포 헤드라인 + 짧은 서브텍스트. 장식 없음. `motion`으로 page fade+12px 정도만.
- `LatestThinking`: 서버에서 `features/posts`의 `getPosts({ limit: 1, sort: '-published_at' })` →
  최신 글 제목 + `ArrowLink`. 데이터 계층 엔드투엔드 검증.
- `SiteFooter`: 텍스트 링크 소수.
- `_container` 없음(상호작용 없음).

## 11. Error & SEO (foundation 포함)

미루면 나중에 귀찮은 것만 최소로 넣는다.

- **에러/로딩**: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/loading.tsx`
  (PPOS 톤의 조용한 스켈레톤/메시지).
- **메타데이터 전략**: 루트 `metadata` 기본값(title 템플릿·description·OG 기본·robots),
  `lib/metadata/metadata.ts`의 `buildMetadata()`/`generateMetadata` 헬퍼(페이지·글별 확장용).
  블로그/프로젝트 상세의 실제 `generateMetadata` 사용은 각 페이지 마일스톤에서, 전략·헬퍼는 지금.

## 12. 규칙 강제 (ESLint + Husky)

### ESLint — 절대 금지 vs 권장

**절대 금지(error, 예외 불가):**
- Barrel export(`ExportAllDeclaration`, `src/**/index.{ts,tsx}` 생성).
- 깊은 상대 부모 경로 import(`../*` …) → alias.
- 레이어 역방향: `components/**`→`@features/*`·`@app/*`, `features/**`→`@app/*`.
- `sonner` 직접 import(`@lib/toast` 외).

**권장(error지만 명시적 예외 허용):**
- `app/**/page.tsx`는 기본 Server Component(`"use client"` 지양).
- `app/**/_components/**`는 데이터 로딩(services/stores) 지양.
- 예외가 정당한 고상호작용 페이지(editor/canvas/admin 등)는
  `// eslint-disable-next-line <rule> -- <사유>` 주석으로 허용. 완전 금지보다 명시적 예외 방식.

### Husky

- `pre-commit`: lint-staged → 스테이지된 `*.{ts,tsx}`에 `eslint --fix` + `prettier --write`.
- `commit-msg`: commitlint(`@commitlint/config-conventional`) — Conventional Commits 강제.

## 13. 배포 형태 (이번엔 설정만)

- `next.config.ts`: `output: 'standalone'`, `images.remotePatterns`에 `raw.githubusercontent.com`
  (+ 추후 미러 도메인).
- `Dockerfile`: standalone 실행 스켈레톤(corepack pnpm). 실제 빌드/터널/도메인/env는 배포 마일스톤.

## 14. 정리 & 문서화

### Astryx 제거

`@astryxdesign/*` 3종 의존성 제거, `.claude/CLAUDE.md`의 ASTRYX 블록 제거.

### `docs/references/` = 컨벤션 SSOT

규칙 **본문은 여기만** 둔다. 바뀌면 이 디렉터리만 고친다.

```
docs/references/
  architecture.md     # 레이어·import(no-barrel)·alias·페이지 패턴·ROUTES
  state-model.md      # 상태 모델 표·폼·Toast·안티패턴
  design-language.md  # PPOS 요약 + 토큰(색·타이포·spacing·레이아웃·모션)
  content-api.md      # content-v1.md(계약 SSOT) 링크 + 프론트 소비 규칙(RSC-first)
```

### `.claude/CLAUDE.md` = 얇은 인덱스

규칙 본문 없이 `docs/references/*`·계약 사본·이 spec을 가리키는 링크만. 상단에 "진실 원천은
`docs/references/`" 명시. drift 방지.

### 타이밍

인덱싱/문서화는 **이 마일스톤 구현 완료 후** 실제 코드 구조를 반영해 작성(끝 단계 태스크).

## 15. 테스트

Vitest + Testing Library, 가볍게:

1. **계약 적합성 겸 파싱 테스트**: `posts.api`(대표)가 mock/예시 JSON을 올바르게 언랩·타이핑
   (fetch 모킹으로 `api` 경로 1케이스; `projects.api`는 동일 패턴이라 스모크만).
2. **렌더 스모크 테스트**: `/`(랜딩)가 Hero 헤드라인과 최근 글 링크를 렌더(mock 소스).

추가로 `tsc --noEmit`, eslint, Husky 훅 동작 확인.

## 16. 명시적 범위 밖

Zustand·nuqs·RHF의 사용/설치, 블로그 목록·상세, 프로젝트 목록·상세, resume·now·about 페이지,
다크모드, 검색·RSS·OG 이미지 생성, 실제 배포·터널 연결, ingest 파이프라인(백엔드 몫).
각각 별도 마일스톤(spec → plan)으로 진행.
