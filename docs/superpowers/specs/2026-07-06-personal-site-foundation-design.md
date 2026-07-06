# 개인 사이트 프론트엔드 — 초기 세팅(기반) 설계

> 상태: 합의됨. 이 문서는 "기반(foundation)" 마일스톤의 단일 설계 기준이다.
> 상위 디자인 헌장: PPOS (Personal Product Operating System) v1.
> API 계약 SSOT: `api` repo의 `docs/api-contract/content-v1.md` (이 repo에 참조 사본을 둔다).

## 1. 배경과 목표

개인 사이트(랜딩 + 기술 블로그 + 포트폴리오 + 이력)를 만든다. 이번 마일스톤의 목적은
**이후 모든 페이지 작업이 올라탈 레일을 까는 것**이다. 완성된 페이지 세트가 아니라,
스택·디자인 토큰·데이터 계층·대표 페이지 한 개로 이루어진 검증된 기반을 만든다.

### 확정된 상위 결정

- **스택**: Next.js (App Router), TypeScript, 패키지 매니저 npm.
- **디자인 기반**: Astryx 제거 → PPOS를 커스텀 토큰 + CSS로 직접 구현.
- **스타일링**: CSS Modules + `:root` CSS 변수(디자인 토큰). 컴파일러 마법·유틸리티 프레임워크 없음.
- **콘텐츠**: `api.raven.kr`(계약 `content-v1.md`)에서 **서버사이드 fetch(SSG + ISR)**.
  브라우저는 API를 직접 호출하지 않는다 → MVP에서 CORS 무관.
- **배포**: 자가 홈서버 + Cloudflare Tunnel. Next.js를 Node 서버(`output: 'standalone'`)로
  운영하며 ISR·on-demand revalidation을 자체 운영. (실제 배포는 별도 마일스톤, 이번엔 설정만.)
- **폰트**: `next/font/local`로 Pretendard(주) + IBM Plex Mono(보조) 셀프호스팅.

## 2. 완료 기준 (Definition of Done)

- `npm run dev`로 뜨고, PPOS 토큰·폰트·레이아웃이 적용된 **대표 페이지 `/`(랜딩 Hero)**가 렌더된다.
- `content-v1.md` 계약에 맞는 **타입·데이터 계층**이 있고, 백엔드 콘텐츠 API가 아직 없으므로
  **mock 픽스처**로 동작하다가 env 토글(`CONTENT_SOURCE=api`)로 실 API에 붙는다.
- 대표 페이지가 데이터 계층을 **엔드투엔드로 한 번 태운다**(Hero 하단 "최근 글 1개" 링크).
- `POST /api/revalidate` 웹훅 수신부가 존재하고 시크릿을 검증한다.
- `tsc`(타입체크), eslint, 최소 테스트(2종)가 통과한다.

## 3. 디렉터리 구조

```
src/
  app/
    layout.tsx              # <html lang="ko">, 폰트 변수 주입, 전역 셸
    page.tsx                # 대표 페이지: 랜딩 Hero (/)
    globals.css             # CSS reset + 토큰 import
    api/revalidate/route.ts # 백엔드 → 프론트 revalidation 웹훅 수신
  lib/api/
    types.ts                # content-v1 계약 타입 (SSOT 미러)
    client.ts               # 서버 전용 fetch 래퍼 (캐시 태그/재검증)
    content.ts              # getPosts / getPost / getProjects / getProject
    mock.ts                 # 계약 예시 JSON 픽스처 (임시)
    index.ts                # 소스 스위치(mock|api) 진입점
  components/
    Container.tsx           # 레이아웃 폭 컨테이너
    ArrowLink.tsx           # "Read →" 화살표 링크
    (Prose, PostRow 등은 페이지 마일스톤에서 확장)
  styles/
    tokens.css              # 색·타이포·레이아웃·모션 토큰 (:root)
    reset.css               # 최소 reset
docs/api-contract/content-v1.md  # api repo SSOT의 참조 사본
next.config.ts              # output:'standalone', images.remotePatterns
Dockerfile                  # standalone 실행 스켈레톤 (배포 마일스톤용, 실행 안 함)
```

## 4. 디자인 토큰 (PPOS → CSS 변수)

`src/styles/tokens.css`의 `:root`에 헌장 값을 그대로 정의한다. 앱 코드는 절대 raw hex/px를
쓰지 않고 토큰만 참조한다.

### 색 (Color)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-canvas` | `#F7F7F5` | 페이지 배경 |
| `--color-surface` | `#FFFFFF` | 표면(카드 등) |
| `--color-text` | `#161616` | 본문 텍스트 |
| `--color-text-secondary` | `#5F5F5F` | 보조 텍스트 |
| `--color-text-muted` | `#909090` | 흐린 텍스트 |
| `--color-border` | `#ECEBE8` | 경계선 |
| `--color-accent` | `#1D4ED8` | 링크·hover·selection·interaction 전용 (branding 아님) |
| `--color-accent-hover` | `#1747C0` | accent hover/active |

- accent는 흰색·canvas 배경 위 텍스트로 WCAG AA(4.5:1)를 만족하는 차분한 블루로 확정.
  (`#1D4ED8` on `#FFFFFF` ≈ 6.3:1.) 링크·선택·상호작용에만 쓰고 브랜딩에는 쓰지 않는다.

### 타이포 (Typography)

- 스케일: `--fs-72 --fs-56 --fs-40 --fs-28 --fs-20 --fs-18 --fs-15 --fs-13` (px 기반, rem 변환).
- 본문 18px, 읽기 폭 720px.
- 폰트 변수: `--font-sans`(Pretendard), `--font-mono`(IBM Plex Mono) — `next/font/local`이 주입.

### 레이아웃 (Layout)

`--w-container 1280 / --w-content 960 / --w-reading 720 / --w-hero 640`,
`--grid-cols 12`, `--gap 24`, `--outer 80`, `--section-gap 160`, `--radius 16` (px).

### 모션 (Motion)

`--dur 200ms`. 규칙: hover opacity 95%→100%, card `translateY(2px)`, page fade + 12px.
parallax·과한 모션 없음. `prefers-reduced-motion` 존중.

### 스코프 밖

다크모드는 PPOS 헌장에 없으므로 이번 범위 밖. 토큰을 `light-dark()` 없이 단일 값으로 두되,
추후 확장 시 토큰 레이어만 손대면 되도록 구조만 남긴다.

## 5. 데이터 계층 (계약 기반)

### 타입 (`types.ts`) — `content-v1.md` 미러

```ts
export interface Envelope<T> {
  data: T;
  meta: {
    requestId: string;
    serverTime: string; // ISO8601
    pagination?: Pagination;
  };
}
export interface Pagination { total: number; page: number; limit: number; }
export interface ApiErrorBody { error: { code: string; message: string }; meta: unknown; }

export interface ContentListItem {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  published_at: string;  // ISO8601 UTC
  updated_at: string;    // ISO8601 UTC
  cover_image_url: string | null;
  reading_time_min?: number;
  status: "published";   // 공개 응답은 항상 published
}
export interface ContentDetail extends ContentListItem {
  body_markdown: string;
  frontmatter: Record<string, unknown>; // 파싱된 YAML 원본 그대로
}
export interface ListParams {
  tag?: string;
  page?: number;   // ≥1, 기본 1
  limit?: number;  // 1~100, 기본 20
  sort?: "-published_at" | "published_at" | "-updated_at" | "updated_at" | "title";
}
```

프로젝트 고유 필드(role, period, stack[], links{repo,live})는 별도 타입 없이
`frontmatter`에서 읽는다. 필요 시 프론트에 `ProjectFrontmatter` 헬퍼 타입만 추가한다.

### 클라이언트 (`client.ts`)

- `import 'server-only'` — 서버에서만 실행.
- 베이스 URL: `process.env.CONTENT_API_BASE` (기본 `https://api.raven.kr`).
- Next fetch 캐시: `next: { tags, revalidate }`. 태그 스킴:
  - 목록: `posts`, `projects`
  - 상세: `post:<slug>`, `project:<slug>`
- 기본 `revalidate`: 3600s (웹훅으로 즉시 무효화되므로 폴백 용도).

### 콘텐츠 함수 (`content.ts`)

`getPosts(params)`, `getPost(slug)`, `getProjects(params)`, `getProject(slug)`.
envelope를 언랩해 `data`를 반환. HTTP 404 → `notFound()`. 그 외 실패 → throw.

### 소스 스위치 (`index.ts` + `mock.ts`)

- `process.env.CONTENT_SOURCE`(`mock` | `api`, 기본 `mock`).
- `mock`: `content-v1.md`의 예시 응답을 픽스처로 반환(백엔드 콘텐츠 API 미구현 대응).
- `api`: 실제 `client.ts` 경유. 백엔드 준비 후 env만 바꿔 스왑.
- mock은 임시. 실 API 안정화 후 제거하거나 테스트 픽스처로만 남긴다.

## 6. revalidate 라우트 (`app/api/revalidate/route.ts`)

계약의 백엔드 → 프론트 웹훅 수신부.

```
POST /api/revalidate
Header: X-Revalidate-Secret: <REVALIDATE_SECRET>
Body:   { "changed": [{ "type": "post"|"project", "slug": "..." }] }
```

- 시크릿 불일치 → 401.
- 각 항목에 대해 `revalidateTag('post:'+slug)` 등 + 목록 태그(`posts`/`projects`) 무효화.
- 200 `{ revalidated: true, count }` 반환. `changed`가 비면 목록 태그만 무효화.

## 7. 대표 페이지: 랜딩 Hero (`/`)

PPOS 랜딩 원칙(큰 타이포, 거의 없는 UI, 최소 시각 노이즈)을 따른 **수직 슬라이스**:

- **Hero**: 큰 타이포 한 문장/헤드라인 + 짧은 서브텍스트. 장식 없음.
- **최근 생각(Latest Thinking) 1건**: `getPosts({ limit: 1, sort: '-published_at' })`로 최신 글
  제목 + `Read →` 링크 1개. 데이터 계층을 엔드투엔드로 태우는 최소 지점.
- **미니멀 푸터**: 텍스트 링크 소수.
- 나머지 랜딩 흐름(Featured Build, Now 등)은 다음 마일스톤. 이번엔 Hero + 데이터 슬라이스만.

ISR: 기본 `revalidate` + `posts` 태그. 웹훅으로 즉시 갱신.

## 8. 배포 형태 (이번엔 설정만)

- `next.config.ts`: `output: 'standalone'`, `images.remotePatterns`에
  `raw.githubusercontent.com`(+ 추후 미러 도메인 자리).
- `Dockerfile`: standalone 산출물 실행 스켈레톤(빌드/실행은 배포 마일스톤).
- 실제 Cloudflare Tunnel 연결·도메인·env 주입은 범위 밖.

## 9. 정리 작업 (Astryx 제거)

- `@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@astryxdesign/cli` 의존성 제거.
- `.claude/CLAUDE.md`의 `<!-- ASTRYX:START -->…<!-- ASTRYX:END -->` 블록 제거,
  PPOS/프로젝트 규칙으로 대체(별도 마일스톤에서 확장 가능하나 최소 정리는 이번에).

## 10. 테스트

Vitest + Testing Library, 가볍게:

1. **계약 적합성 겸 파싱 테스트**: `content.ts`가 `content-v1.md` 예시 JSON(픽스처)을
   올바르게 언랩/타이핑하는지. fetch 모킹.
2. **렌더 스모크 테스트**: `/`(랜딩)가 Hero 헤드라인과 최근 글 링크를 렌더하는지(mock 소스).

추가로 `tsc --noEmit`, eslint.

## 11. 명시적 범위 밖

랜딩 전체 흐름(Hero 외), 블로그 목록/상세, 프로젝트 목록/상세, resume·now 페이지,
다크모드, 실제 배포·터널 연결, ingest 파이프라인(백엔드 몫), 검색·RSS·OG 이미지.
이들은 각각 별도 마일스톤(spec → plan)으로 진행한다.
