# raven.kr

개인 사이트 겸 기술 블로그와 포트폴리오. 하나의 Next.js App Router 앱이 공개 사이트와 관리자 CMS를 함께 제공한다. 글과 로그인은 Supabase Postgres/Auth, 이미지는 Cloudflare R2를 사용한다.

## 스택

- Next.js 16 (App Router) + React 19 + React Compiler
- TypeScript, pnpm
- CSS Modules + `:root` CSS 변수 토큰 (Tailwind는 쓰지 않는다)
- Base UI (`@base-ui/react`), motion (`motion/react`)
- 마크다운 렌더: unified + remark/rehype, 코드 하이라이트는 shiki
- 서버 상태: TanStack Query (상호작용 페이지 등장 시), 검증: zod
- 콘텐츠·인증: Supabase Postgres/Auth, 이미지: Cloudflare R2

RSC 우선. 읽기 전용 콘텐츠는 서버 컴포넌트에서 직접 fetch하고 클라이언트에서 다시 요청하지 않는다.

## 시작하기

필요한 것: Node 22 이상, pnpm 9.12.0 (`packageManager` 필드로 고정).

```bash
pnpm install
pnpm dev        # 개발 서버 (http://localhost:3500)
```

기본은 mock 데이터로 뜬다. 백엔드 없이 바로 돌려볼 수 있다.

| 명령             | 하는 일                    |
| ---------------- | -------------------------- |
| `pnpm dev`       | 개발 서버                  |
| `pnpm build`     | 프로덕션 빌드 (standalone) |
| `pnpm start`     | 빌드 결과 실행             |
| `pnpm test`      | vitest 실행                |
| `pnpm typecheck` | `tsc --noEmit`             |
| `pnpm lint`      | eslint                     |

## 라우트

| 경로                            | 설명                          |
| ------------------------------- | ----------------------------- |
| `/`                             | 홈 (히어로 + 최근 글)         |
| `/blog`, `/blog/[slug]`         | 글 목록과 상세                |
| `/projects`, `/projects/[slug]` | 프로젝트 목록과 상세          |
| `/health`                       | 헬스 체크 (배포 폴링용)       |
| `/api/revalidate`               | 기존 외부 API 연동용 ISR 웹훅 |

## 콘텐츠

글은 같은 Next.js 앱의 `/admin`에서 Markdown으로 작성한다. 공개 화면도 이 앱이 Supabase에서 `published` 글만 직접 읽으며, 별도 콘텐츠 API는 사용하지 않는다. `/assets/...` 이미지 경로는 렌더링할 때 `R2_PUBLIC_URL` 아래의 공개 URL로 바뀐다.

소스는 환경변수로 바꾼다.

| 변수                | 기본값                 | 설명                               |
| ------------------- | ---------------------- | ---------------------------------- |
| `CONTENT_SOURCE`    | `mock`                 | 글 소스: `mock`, `api`, `supabase` |
| `CONTENT_API_BASE`  | `https://api.raven.kr` | 기존 `api` 호환 모드에서만 사용    |
| `REVALIDATE_SECRET` | —                      | revalidate 웹훅 인증 시크릿        |
| `R2_PUBLIC_URL`     | —                      | `/assets/...`를 제공할 R2 공개 URL |

운영 구조는 `CONTENT_SOURCE=supabase`다. `mock`은 외부 설정 없는 로컬 개발과 안전한 초기 배포에, `api`는 이전 콘텐츠 API 호환에만 남아 있다. CMS를 쓰려면 `.env.example`을 `.env.local`로 복사하고 [CMS 설정 문서](docs/cms-setup.md)를 따른다. 프로젝트는 현재 mock 데이터를 유지한다.

## 구조

```
src/
  app/          라우팅, 레이아웃, 서버 오케스트레이션 (얇게)
  features/     기능 모듈 (posts, projects) — API, 타입, 컴포넌트
  components/   도메인 비종속 공용 UI
  lib/          markdown, metadata, api 클라이언트
  constants/    ROUTES 등
  configs/      env 등
  styles/       토큰, 폰트
```

레이어 규칙 몇 가지.

- import는 위에서 아래로만 흐른다. `components`가 `features`나 `app`을 가져오지 않는다.
- barrel(`index.ts`)로 묶지 않고 실제 파일을 직접 참조한다.
- 상대 경로 대신 path alias(`@features/*`, `@lib/*` 등)를 쓴다.
- 라우트 문자열은 `ROUTES`로만 만든다.

전체 컨벤션의 기준은 `docs/references/`다.

## 배포

현재 `main`은 홈서버 Docker Compose와 self-hosted runner로 자동 배포된다. 운영 목표는 main을 OCI와 새 Supabase Cloud 및 production R2(`cdn.raven.kr`)로 먼저 옮긴 뒤, dev를 홈서버의 self-hosted Supabase와 별도 이미지 서버로 분리하는 것이다. OCI 전환은 수동 opt-in으로 검증하고 acceptance 이후 자동 전환 여부를 결정한다.

현재 상태, 단계별 acceptance, 환경별 경계와 보존 규칙은 [`docs/deployment.md`](docs/deployment.md)와 [`docs/environment-split.md`](docs/environment-split.md)를 본다.

## 문서

- `docs/references/`에 아키텍처, 상태 모델, 디자인 언어, 콘텐츠 API 소비 규칙이 있다. 컨벤션의 기준 문서다.
- `docs/api-contract/content-v2.md`는 현재 사용하지 않는 기존 콘텐츠 API 계약의 보관본이다.
- `docs/deployment.md`는 배포 절차를 다룬다.
- `docs/cms-setup.md`는 Supabase Auth/Postgres와 Cloudflare R2 설정을 다룬다.
- [Day0 블로그 전면 개편 계획과 상태](docs/superpowers/plans/2026-09-10-day0-blog-redesign.md)는 진행 순서와 완료 증거를 추적한다.
- [Channel 블로그 레이아웃 교정 계획과 상태](docs/superpowers/plans/2026-09-10-channel-blog-layout-revision.md)는 사용자 시각 반려 후의 홈·상세 재구성과 검증 상태를 추적한다.
- [블로그 내비게이션과 command palette 교정 계획](docs/superpowers/plans/2026-09-10-blog-navigation-command-palette.md)은 승인된 이미지 방향에 따른 상세 탐색, 전역 검색 palette와 홈 밀도 교정을 추적한다.
- `docs/superpowers/`에 기능별 설계 스펙과 구현 계획이 쌓여 있다.
