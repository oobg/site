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
ROUTES.BLOG.DETAIL(slug); // '/blog/:slug'
ROUTES.PROJECTS.LIST; // '/projects'
ROUTES.PROJECTS.DETAIL(slug);
```
