# 개인 사이트 프론트엔드 — 초기 세팅(기반) 설계

> 상태: 합의됨. 이 문서는 "기반(foundation)" 마일스톤의 단일 설계 기준이다.
> 상위 디자인 헌장: PPOS (Personal Product Operating System) v1.
> API 계약 SSOT: `api` repo의 `docs/api-contract/content-v1.md` (이 repo에 참조 사본을 둔다).

## 1. 배경과 목표

개인 사이트(랜딩 + 기술 블로그 + 포트폴리오 + 이력)를 만든다. 이번 마일스톤의 목적은
**이후 모든 페이지 작업이 올라탈 레일(아키텍처·토큰·상태 모델·데이터 계층·규칙 강제)을 까는 것**이다.
완성된 페이지 세트가 아니라, 검증된 기반과 대표 페이지 한 개를 만든다.

### 확정된 상위 결정

- **스택**: Next.js (App Router), TypeScript, 패키지 매니저 npm.
- **컴포넌트 뼈대**: Base UI(`@base-ui-components/react`) — 헤드리스/접근성 프리미티브.
  부분 애니메이션은 framer-motion. 모든 UI 요소는 `components/`(또는 feature `components/`)에
  **primitive로 만들어 호출**한다.
- **디자인 기반**: Astryx 제거 → PPOS를 커스텀 토큰 + CSS로 직접 구현.
- **스타일링**: CSS Modules + `:root` CSS 변수(디자인 토큰). 컴파일러 마법·유틸리티 프레임워크 없음.
- **콘텐츠 패칭(하이브리드)**: 정적 읽기 페이지(랜딩 Hero·블로그 본문)는 **RSC에서 서버 fetch로
  직접 렌더**(클라이언트 JS 최소, PPOS 부합). `_container`+TanStack Query는 **실제 상호작용
  (필터·검색·폼)이 있는 곳에만** 도입. 콘텐츠 GET은 서버사이드 fetch 전제 → MVP에서 CORS 무관.
- **배포**: 자가 홈서버 + Cloudflare Tunnel. Next.js를 Node 서버(`output: 'standalone'`)로
  운영하며 ISR·on-demand revalidation을 자체 운영. (실제 배포는 별도 마일스톤, 이번엔 설정만.)
- **폰트**: `next/font/local`로 Pretendard(주) + IBM Plex Mono(보조) 셀프호스팅.

## 2. 완료 기준 (Definition of Done)

- `npm run dev`로 뜨고, PPOS 토큰·폰트·레이아웃이 적용된 **대표 페이지 `/`(랜딩 Hero)**가 렌더된다.
- 레이어 스캐폴드·path alias·ROUTES 헬퍼·상태 라이브러리 프로바이더가 배선돼 있다.
- `content-v1.md` 계약에 맞는 **타입·데이터 계층**이 있고, 백엔드 콘텐츠 API가 아직 없으므로
  **mock 픽스처**로 동작하다가 env 토글(`CONTENT_SOURCE=api`)로 실 API에 붙는다.
- 대표 페이지가 데이터 계층을 **엔드투엔드로 한 번 태운다**(Hero 하단 "최근 글 1개", RSC 서버 fetch).
- `POST /api/revalidate` 웹훅 수신부가 존재하고 시크릿을 검증한다.
- **ESLint 아키텍처 규칙**(barrel 금지·상대경로 제한·레이어 역방향 금지·`_components` 데이터 로딩
  금지·`page.tsx` client 금지·sonner 직접 import 금지)이 강제되고 통과한다.
- **Husky** pre-commit(lint-staged) + commit-msg(commitlint, Conventional Commits)가 동작한다.
- `tsc --noEmit`, eslint, 최소 테스트(2종)가 통과한다.

## 3. 레이어 아키텍처

```text
app/ → features/ → components/ → hooks/, lib/, utils/
                             ↑
                 services/, constants/, configs/
```

- `app/`: 라우팅·레이아웃·서버 오케스트레이션만. 비즈니스 로직 금지. 얇게 유지.
- `features/`: 기능 단위 모듈(도메인 로직).
- `components/`: 도메인 비종속 공용 UI(primitive).
- `hooks/`, `lib/`, `utils/`, `services/`, `constants/`, `configs/`, `stores/`, `styles/`, `types/`:
  하위 공용 레이어.
- **역방향 import 금지**(예: `components/`가 `features/`·`app/`를 import하지 못한다).

### Import 규칙

- **Barrel export 금지** — `index.ts`로 묶지 않는다. 실제 파일을 직접 참조한다.
- `../../` 형태의 깊은 상대 경로 대신 **path alias** 사용(같은 폴더 `./` 짧은 import는 허용).
- 타입은 `import type` 사용.

### Path Alias (tsconfig `paths` + Next `webpack`/`turbopack`)

```
@features/*  @components/*  @configs/*  @constants/*  @hooks/*
@lib/*  @services/*  @stores/*  @styles/*  @types/*  @utils/*  @/*
```

## 4. 디렉터리 구조

```
src/
  app/
    layout.tsx              # <html lang="ko">, 폰트 변수, <AppProviders> 배선, 전역 셸
    page.tsx                # 대표 페이지: 랜딩 Hero (/), Server Component
    not-found.tsx
    globals.css             # reset + 토큰 import
    api/revalidate/route.ts # 백엔드 → 프론트 revalidation 웹훅 수신
  features/
    posts/                  # 블로그 글 피처 (/content/posts)
      services/
        posts.api.ts        # 서버 read: getPosts/getPost (canonical)
        posts.query.ts      # postsQueryOptions/postQueryOptions
      types/posts.types.ts  # Post 타입 alias + PostFrontmatter (공통 계약 타입은 @lib/api)
      fixtures/posts.mock.ts
      components/            # PostRow 등 (페이지 마일스톤에서 확장)
    projects/               # 프로젝트 피처 (/content/projects)
      services/
        projects.api.ts     # 서버 read: getProjects/getProject
        projects.query.ts   # projectsQueryOptions/projectQueryOptions
      types/projects.types.ts  # Project 타입 alias + ProjectFrontmatter
      fixtures/projects.mock.ts
      components/
  components/
    providers/AppProviders.tsx  # "use client": QueryClientProvider + NuqsAdapter + Toaster
    layout/Container.tsx        # 레이아웃 폭 컨테이너 (primitive)
    ui/ArrowLink.tsx            # "Read →" 화살표 링크 (primitive)
    (base-ui 래핑 primitive는 필요 시 추가)
  lib/
    api/
      http.ts               # 서버 전용 envelope fetch 래퍼(제네릭, 캐시 태그/재검증, 에러/404)
      contract.types.ts     # content-v1 공통 계약 타입(Envelope/Pagination/ListItem/Detail/ListParams)
    toast.ts                # Toast.success/error 래퍼 (sonner를 여기서만 import)
  constants/
    routes.ts               # ROUTES 헬퍼
  configs/
    query-client.ts         # QueryClient 기본 옵션(staleTime 등)
    env.ts                  # 런타임 env 접근(zod 검증)
  hooks/ utils/ stores/ types/   # 공용 하위 레이어(초기엔 빈 골격 + placeholder 최소화)
  styles/
    tokens.css              # 색·타이포·레이아웃·모션 토큰 (:root)
    reset.css               # 최소 reset
docs/api-contract/content-v1.md   # api repo SSOT의 참조 사본
eslint.config.mjs           # 아키텍처 규칙 강제
.husky/pre-commit .husky/commit-msg
commitlint.config.mjs
next.config.ts              # output:'standalone', images.remotePatterns
Dockerfile                  # standalone 실행 스켈레톤 (배포 마일스톤용, 실행 안 함)
```

> 빈 레이어 폴더(`hooks/`, `stores/` 등)는 실제 파일이 생길 때 만든다(no-barrel·불필요 파일 회피).

## 5. App Router & 페이지 패턴

`src/app`은 URL·서버 경계를 표현하는 얇은 라우팅 레이어. URL에 안 드러나는 논리 그룹은
Route Group `(group)`. layout은 provider/shell/gate만, page는 서버 진입점만.

### 페이지 패턴 (하이브리드)

```
page.tsx (Server Component)
  ├─ 정적 읽기 페이지: 서버 read 함수 직접 호출 → _components 렌더 (기본, PPOS)
  └─ 상호작용 페이지: prefetch(queryOptions) + HydrationBoundary → _container(use client) → _components
```

- `page.tsx`: metadata, params/searchParams, 권한/redirect/notFound, (상호작용 시) prefetch·
  HydrationBoundary. **`"use client"` 금지**(ESLint 강제).
- `_container/index.tsx`: 클라이언트 경계 시작점(hook·form·browser API·이벤트·store·useQuery).
  **상호작용이 있는 페이지에만 존재.**
- `_components/`: 해당 page 전용 표시 컴포넌트. **자체 데이터 로딩·query/mutation·전역 store 접근
  금지**(ESLint 강제). 데이터·콜백은 상위에서 props로. 공유되기 시작하면 `features/<f>/components/`
  또는 `components/`로 승격.

### ROUTES 헬퍼

라우트 문자열 직접 작성 금지. `src/constants/routes.ts`에 정의하고 `ROUTES.*`만 사용.

```ts
ROUTES.HOME;              // '/'
ROUTES.BLOG.LIST;        // '/blog'
ROUTES.BLOG.DETAIL(slug);
ROUTES.PROJECTS.LIST;
ROUTES.PROJECTS.DETAIL(slug);
```

(이번 마일스톤은 HOME만 실제 사용, 나머지는 헬퍼에 미리 정의.)

## 6. 상태 모델

| 상태 | 저장소 | 예 |
|---|---|---|
| 서버 상태 | TanStack Query | 글/프로젝트 목록·상세 |
| 클라이언트 상태 | Zustand | (향후) 워크스페이스/UI 컨텍스트 |
| URL 상태 | nuqs | (향후) 태그 필터·페이지·검색어·탭 |
| 폼 상태 | react-hook-form + zod | (향후) 폼 |

- 선택 가이드: 서버에서 받음 → react-query / 새로고침 유지·URL 표현 가능 → nuqs /
  페이지 간 공유·비서버 → Zustand / 폼 입력 → react-hook-form.
- 폼 컨벤션: `react-hook-form` + `zod` 고정, 에러 메시지 한국어.
- 피드백은 `Toast.success` / `Toast.error`(`@lib/toast`)만 사용. **sonner 직접 import 금지**(ESLint).
- 안티패턴: **서버 데이터를 Zustand에 복사 금지**(캐시 정합성·invalidate 무력화).

> 기반 마일스톤에서는 라이브러리 설치 + `AppProviders` 배선(QueryClientProvider·NuqsAdapter·
> Toaster)까지 한다. 랜딩 Hero 자체는 정적이라 이들을 직접 쓰지 않지만, 이후 페이지의 레일로 둔다.

## 7. 디자인 토큰 (PPOS → CSS 변수)

`src/styles/tokens.css`의 `:root`에 헌장 값을 정의. 앱 코드는 raw hex/px 금지, 토큰만 참조.

### 색

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-canvas` | `#F7F7F5` | 페이지 배경 |
| `--color-surface` | `#FFFFFF` | 표면 |
| `--color-text` | `#161616` | 본문 |
| `--color-text-secondary` | `#5F5F5F` | 보조 |
| `--color-text-muted` | `#909090` | 흐림 |
| `--color-border` | `#ECEBE8` | 경계선 |
| `--color-accent` | `#1D4ED8` | 링크·hover·selection·interaction 전용 |
| `--color-accent-hover` | `#1747C0` | accent hover/active |

- accent는 흰색·canvas 위에서 WCAG AA(4.5:1↑) 만족(`#1D4ED8` on `#FFFFFF` ≈ 6.3:1). 브랜딩에 안 씀.

### 타이포

- 스케일 `--fs-72 … --fs-13`(px→rem), 본문 18px, 읽기 폭 720px.
- `--font-sans`(Pretendard), `--font-mono`(IBM Plex Mono) — `next/font/local`이 주입.

### 레이아웃

`--w-container 1280 / --w-content 960 / --w-reading 720 / --w-hero 640`, `--grid-cols 12`,
`--gap 24`, `--outer 80`, `--section-gap 160`, `--radius 16` (px).

### 모션

`--dur 200ms`. hover opacity 95→100, card `translateY(2px)`, page fade+12px. parallax·과한 모션 없음.
framer-motion은 이 규칙 안에서만. `prefers-reduced-motion` 존중.

### 스코프 밖

다크모드는 PPOS 헌장에 없어 이번 범위 밖(토큰 단일 값, 추후 토큰 레이어만 확장).

## 8. 데이터 계층 (계약 기반)

> **posts / projects는 별도 피처로 분리.** 두 리소스는 계약 셰이프가 동일하므로 **공통 계약
> 타입·fetch 래퍼만 `lib/api`에서 공유**하고, 서버 read 함수·queryOptions·frontmatter 헬퍼·mock·
> 컴포넌트는 각 피처(`features/posts`, `features/projects`)가 독립적으로 갖는다.

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
  body_markdown: string;
  frontmatter: Record<string, unknown>;          // 파싱된 YAML 원본 그대로
}
export interface ListParams {
  tag?: string; page?: number; limit?: number;
  sort?: "-published_at" | "published_at" | "-updated_at" | "updated_at" | "title";
}
```

frontmatter 헬퍼 타입은 **피처별**로 둔다:

```ts
// features/posts/types/posts.types.ts
import type { ContentListItem, ContentDetail } from "@lib/api/contract.types";
export type PostListItem = ContentListItem;
export type Post = ContentDetail;
export interface PostFrontmatter { date?: string; cover?: string; /* 글 고유 키 */ }

// features/projects/types/projects.types.ts
import type { ContentListItem, ContentDetail } from "@lib/api/contract.types";
export type ProjectListItem = ContentListItem;
export type Project = ContentDetail;
export interface ProjectFrontmatter {
  role?: string; period?: string; stack?: string[];
  links?: { repo?: string; live?: string };
}
```

### 서버 fetch 래퍼 (`lib/api/http.ts`)

- `import 'server-only'`. 베이스 URL `@configs/env`의 `CONTENT_API_BASE`(기본 `https://api.raven.kr`).
- `next: { tags, revalidate }`. 태그: 목록 `posts`/`projects`, 상세 `post:<slug>`/`project:<slug>`.
- envelope 언랩 → `data` 반환. HTTP 404 → `notFound()`. 그 외 실패 → throw. 기본 revalidate 3600s.

### 피처별 read 함수 (canonical)

- `features/posts/services/posts.api.ts`: `getPosts(params)`, `getPost(slug)`.
- `features/projects/services/projects.api.ts`: `getProjects(params)`, `getProject(slug)`.

`@configs/env`의 `CONTENT_SOURCE`(`mock`|`api`, 기본 `mock`)로 분기:
- `mock`: 각 피처 `fixtures/*.mock.ts` 반환(백엔드 콘텐츠 API 미구현 대응).
- `api`: `lib/api/http.ts` 경유. 백엔드 준비 후 env만 `api`로 스왑.
- 정적 RSC 페이지는 이 함수를 서버에서 직접 호출.

### 피처별 TanStack Query 옵션

- `features/posts/services/posts.query.ts`: `postsQueryOptions(params)`, `postQueryOptions(slug)`.
- `features/projects/services/projects.query.ts`: `projectsQueryOptions(params)`, `projectQueryOptions(slug)`.

`queryOptions`(queryKey + queryFn=위 read 함수). 상호작용 페이지의 서버 prefetch + 클라이언트
`useQuery`용. `staleTime` 높게(콘텐츠는 웹훅으로 무효화되므로 클라이언트 재요청 최소). 이번
마일스톤은 정의만, 실제 사용은 상호작용 페이지 등장 시.
- 주의: `*.api.ts`는 `server-only`(lib/api/http)라 클라이언트 번들에 들어갈 수 없다. 클라이언트
  `useQuery`가 실제로 재요청해야 하는 페이지가 생기면, 그 queryFn은 server-only 대신 클라이언트
  안전 경로(공개 API 직접 호출 또는 Route Handler 프록시)를 쓴다. 정적 슬라이스(prefetch+hydrate,
  재요청 없음)에서는 문제 없음.

## 9. revalidate 라우트 (`app/api/revalidate/route.ts`)

```
POST /api/revalidate
Header: X-Revalidate-Secret: <REVALIDATE_SECRET>
Body:   { "changed": [{ "type": "post"|"project", "slug": "..." }] }
```

- 시크릿 불일치 → 401. 각 항목 `revalidateTag('post:'+slug)` 등 + 목록 태그 무효화.
- 200 `{ revalidated: true, count }`. `changed`가 비면 목록 태그만 무효화.

## 10. 대표 페이지: 랜딩 Hero (`/`)

PPOS 랜딩 원칙(큰 타이포, 거의 없는 UI, 최소 시각 노이즈)의 **정적 수직 슬라이스**(RSC):

- **Hero**: 큰 타이포 헤드라인 + 짧은 서브텍스트. 장식 없음. framer-motion으로 page fade+12px 정도만.
- **최근 생각(Latest Thinking) 1건**: 서버에서 `features/posts`의
  `getPosts({ limit: 1, sort: '-published_at' })` 직접 호출 → 최신 글 제목 + `ArrowLink`.
  데이터 계층 엔드투엔드 검증 지점.
- **미니멀 푸터**: 텍스트 링크 소수.
- `_container` 없음(상호작용 없음). 나머지 랜딩 흐름(Featured Build·Now 등)은 다음 마일스톤.

## 11. 규칙 강제 (ESLint + Husky)

### ESLint (`eslint.config.mjs`, flat config)

- Barrel export 금지: `ExportAllDeclaration` 및 `src/**/index.{ts,tsx}` 생성 금지.
- 상대 부모 경로 import 금지(`../*` …) → alias 사용.
- 레이어 역방향 금지: `components/**`는 `@features/*`·`@app/*` 금지, `features/**`는 `@app/*` 금지.
- `app/**/_components/**`는 `@features/*/services/*`·`@services/*`·`@stores/*` import 금지(표시 전용).
- `app/**/page.tsx`는 `"use client"` 금지.
- `sonner`는 `@lib/toast` 외에서 import 금지(추가 규칙).

### Husky

- `pre-commit`: lint-staged → 스테이지된 `*.{ts,tsx}`에 `eslint --fix` + `prettier --write`.
- `commit-msg`: commitlint(`@commitlint/config-conventional`) — Conventional Commits 강제.

## 12. 배포 형태 (이번엔 설정만)

- `next.config.ts`: `output: 'standalone'`, `images.remotePatterns`에 `raw.githubusercontent.com`
  (+ 추후 미러 도메인 자리).
- `Dockerfile`: standalone 실행 스켈레톤(빌드/실행은 배포 마일스톤).
- 실제 Cloudflare Tunnel 연결·도메인·env 주입은 범위 밖.

## 13. 정리 작업 (Astryx 제거)

- `@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@astryxdesign/cli` 의존성 제거.
- `.claude/CLAUDE.md`의 `<!-- ASTRYX:START -->…<!-- ASTRYX:END -->` 블록 제거,
  PPOS/아키텍처 규칙 요약으로 대체.

## 14. 테스트

Vitest + Testing Library, 가볍게:

1. **계약 적합성 겸 파싱 테스트**: `posts.api`(대표)가 mock/예시 JSON을 올바르게 언랩·타이핑.
   (fetch 모킹으로 `api` 경로도 1케이스. `projects.api`는 동일 패턴이라 스모크만.)
2. **렌더 스모크 테스트**: `/`(랜딩)가 Hero 헤드라인과 최근 글 링크를 렌더(mock 소스).

추가로 `tsc --noEmit`, eslint, Husky 훅 동작 확인.

## 15. 명시적 범위 밖

랜딩 전체 흐름(Hero 외), 블로그 목록/상세, 프로젝트 목록/상세, resume·now 페이지, 다크모드,
실제 배포·터널 연결, ingest 파이프라인(백엔드 몫), 검색·RSS·OG 이미지, Zustand/nuqs/RHF의 실제
사용처(라이브러리 설치·배선만 하고 사용은 이후 마일스톤). 각각 별도 마일스톤(spec → plan)으로 진행.
