# 아키텍처 컨벤션

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §3·§5.

## 레이어 방향

```text
app/ → features/ → components/ → hooks/, lib/, utils/
                             ↑
                 services/, constants/, configs/
```

- `app/`: 라우팅·레이아웃·서버 오케스트레이션만. 비즈니스 로직 금지. 얇게.
- `features/`: 기능 단위 모듈(posts, projects). API·상태·타입이 생길 때 승격.
- `components/`: 도메인 비종속 공용 UI(primitive).
- `hooks/`·`lib/`·`utils/`·`services/`·`constants/`·`configs/`·`stores/`·`styles/`·`types/`: 하위 공용.
- **역방향 import 금지**: `components/**` → `@features/*`·`@app/*` 불가. `features/**` → `@app/*` 불가.

## Import 규칙

- **Barrel export 금지** — `index.ts`로 묶지 않음. 실제 파일을 직접 참조.
- 깊은 상대 경로(`../../`) 금지 → **path alias** 사용. 같은 폴더 `./`는 허용.
- 타입은 반드시 `import type`.

## Path Alias

```
@features/*   @components/*  @configs/*   @constants/*  @hooks/*
@lib/*        @services/*    @stores/*    @styles/*     @types/*
@utils/*      @/*
```

## 페이지 패턴 (App Router)

**단일 규칙: page는 얇게. 데이터는 상위에서. 표시 컴포넌트는 props만.**

`_container`·`_components`는 필요할 때만 쓴다(절대 규칙이 아닌 승격 기준 패턴).

```txt
정적 페이지:
  app/page.tsx                       # 서버 진입점 (데이터 서버 fetch)
  app/_components/LandingHero.tsx    # 표시 전용

상호작용 페이지(예시, 이번 범위 밖):
  app/blog/page.tsx                        # 서버 진입점 (+ prefetch/HydrationBoundary)
  app/blog/_container/BlogContainer.tsx    # "use client" 경계
  app/blog/_components/BlogList.tsx        # 표시 전용
```

- `page.tsx`: metadata, params/searchParams, 권한/redirect/notFound. 기본은 Server Component.
- `_container`: 클라이언트 경계(hook·form·browser API·이벤트·store·useQuery). 상호작용 페이지에만.
- `_components`: 표시 전용. 데이터 로딩·query·전역 store 접근 지양. 공유 시 `features/<f>/components/` 또는 `components/`로 승격.

## ROUTES 헬퍼 (`constants/routes.ts`)

라우트 문자열 직접 작성 금지. `ROUTES.*`만 사용.

```ts
ROUTES.HOME; // '/'
ROUTES.BLOG.LIST; // '/blog'
ROUTES.BLOG.DETAIL(category, slug); // '/blog/:category/:slug'
ROUTES.BLOG.LEGACY_DETAIL(slug); // '/blog/:slug' → canonical로 리다이렉트
ROUTES.PROJECTS.LIST; // '/projects'
ROUTES.PROJECTS.DETAIL(slug);
```

## 공개 글 주소와 404 (검색 노출 SSOT)

canonical은 **카테고리와 글 키 두 세그먼트**다: `/blog/{category}/{slug}`.

- 색인에 남은 옛 한 세그먼트 주소는 `app/blog/[category]/page.tsx`가 308로 canonical에
  넘긴다. canonical과 첫 세그먼트 디렉터리를 공유하므로 이 legacy 라우트의 `params.category`는
  **옛 글 키**다. 이름만 보고 카테고리 조회로 바꾸지 말 것.
- `app/blog/[category]/[slug]/page.tsx`는 현재 카테고리와 글 키로 본문을 조회한다.
  예전 카테고리 별칭(`legacy_slug`)은 현재 카테고리 주소로 308 리다이렉트하고, 그 밖의 카테고리
  불일치는 404로 처리한다.
- 라우트 세그먼트는 `@lib/navigation/slug`의 `normalizeRouteSlug`로만 받는다. NFC 정규화와
  경로 이탈(`..`·`/`·`%00`·제어문자) 차단이 여기 한 곳에 있다.
- 화면 링크와 절대 URL(canonical·RSS·JSON-LD) 모두 `ROUTES.BLOG.DETAIL(category, slug)`를 쓴다.
  이 헬퍼가 두 세그먼트를 각각 `@lib/navigation/route-segment`의 `encodeRouteSlug`로 인코딩하므로
  호출 전에 중복 인코딩하지 않는다.

### `loading.tsx`는 글 상세 위에 두지 않는다

라우트 위쪽에 `loading.tsx`가 하나라도 있으면 Next가 Suspense fallback을 먼저 flush하면서
**HTTP 200이 확정**된다. 그 뒤에 도착한 `notFound()`는 상태 코드를 바꾸지 못하고, 없는 글이
200 + 빈 셸(soft 404)로 나간다. 검색엔진에는 "사라진 글이 계속 살아 있는 것"으로 보인다.

그래서 홈 스켈레톤은 `app/(home)/loading.tsx`로 홈 세그먼트 안에만 둔다. 루트 `app/loading.tsx`,
`app/blog/loading.tsx`, `app/blog/[category]/loading.tsx`,
`app/blog/[category]/[slug]/loading.tsx`, `app/projects/[slug]/loading.tsx`를
**되살리지 않는다**. 공개 상세의 부분 로딩은 페이지 안 `<Suspense>`로만 한다(데이터를 이미 읽은
뒤라 상태 코드에 영향이 없다). 목록인 `app/projects/loading.tsx`는 목록 셸을 위한 경계라 이 규칙의
대상이 아니다. Projects 목록의 로딩은 `app/(projects)/projects/loading.tsx`처럼 목록 route group
안에 두어 상세 경로의 404 상태를 가리지 않게 한다.

검증: 프로덕션 빌드 뒤 `.next/standalone/server.js`로 `/blog/{category}/{없는-slug}`와
legacy `/blog/{없는-slug}`가 모두 404인지 본다.
`next dev`나 `next start`가 아니라 standalone이 실제 배포 경로다.

## 검색 노출 산출물

- `app/rss.xml/route.ts` — 최신 공개 글 20개. 본문은 `renderMarkdown` 결과를 CDATA로 싣는다.
  피드 데이터는 `posts.api`의 `getPublishedBlogPostsForFeed()`만 쓴다.
- `lib/metadata/structured-data.ts` — WebSite·Person 그래프는 루트 레이아웃에, BlogPosting은
  글 상세에 inline JSON-LD로 넣는다. 직렬화는 반드시 `serializeJsonLd`를 거친다.
- `lib/metadata/metadata.ts` — 글 상세 메타는 `buildArticleMetadata`(OG `article` + 발행·수정 시각).
