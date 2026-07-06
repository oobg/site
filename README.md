# raven.kr

개인 사이트 겸 기술 블로그와 포트폴리오. Next.js App Router로 만들었고, 글과 프로젝트는 별도 백엔드(`api.raven.kr`)에서 서버사이드로 받아 보여준다.

## 스택

- Next.js 16 (App Router) + React 19 + React Compiler
- TypeScript, pnpm
- CSS Modules + `:root` CSS 변수 토큰 (Tailwind는 쓰지 않는다)
- Base UI (`@base-ui/react`), motion (`motion/react`)
- 마크다운 렌더: unified + remark/rehype, 코드 하이라이트는 shiki
- 서버 상태: TanStack Query (상호작용 페이지 등장 시), 검증: zod

RSC 우선. 읽기 전용 콘텐츠는 서버 컴포넌트에서 직접 fetch하고 클라이언트에서 다시 요청하지 않는다.

## 시작하기

필요한 것: Node 22 이상, pnpm 9.12.0 (`packageManager` 필드로 고정).

```bash
pnpm install
pnpm dev        # 개발 서버 (http://localhost:3000)
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

| 경로                            | 설명                            |
| ------------------------------- | ------------------------------- |
| `/`                             | 홈 (히어로 + 최근 글)           |
| `/blog`, `/blog/[slug]`         | 글 목록과 상세                  |
| `/projects`, `/projects/[slug]` | 프로젝트 목록과 상세            |
| `/health`                       | 헬스 체크 (배포 폴링용)         |
| `/api/revalidate`               | 백엔드 ingest 웹훅 (ISR 재생성) |

## 콘텐츠

글과 프로젝트는 이 저장소에 없다. Obsidian에서 마크다운을 쓰고 콘텐츠 저장소에 커밋하면, GitHub Action이 `api.raven.kr`로 수집하고, 프론트는 그 API를 서버에서 읽는다.

소스는 환경변수로 바꾼다.

| 변수                | 기본값                 | 설명                                                   |
| ------------------- | ---------------------- | ------------------------------------------------------ |
| `CONTENT_SOURCE`    | `mock`                 | `mock`이면 `src/features/*/fixtures`, `api`면 실제 API |
| `CONTENT_API_BASE`  | `https://api.raven.kr` | 콘텐츠 API 베이스 URL                                  |
| `REVALIDATE_SECRET` | —                      | revalidate 웹훅 인증 시크릿                            |

`mock`에서 `api`로 넘어갈 때 소비 코드는 그대로 두고 `CONTENT_SOURCE`만 바꾸면 된다. 계약은 `docs/api-contract/content-v2.md`에 있다.

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

홈서버에서 Docker Compose로 돌리고, nginx-proxy-manager가 `raven.kr`을 컨테이너로 라우팅한다. `main`에 푸시하면 self-hosted 러너가 서버에서 직접 빌드하고, `/health`가 응답하면 교체, 아니면 이전 이미지로 되돌린다.

절차와 오너 설정은 `docs/deployment.md`를 본다.

## 문서

- `docs/references/`에 아키텍처, 상태 모델, 디자인 언어, 콘텐츠 API 소비 규칙이 있다. 컨벤션의 기준 문서다.
- `docs/api-contract/content-v2.md`는 프론트와 백엔드가 공유하는 콘텐츠 API 계약이다.
- `docs/deployment.md`는 배포 절차를 다룬다.
- `docs/superpowers/`에 기능별 설계 스펙과 구현 계획이 쌓여 있다.
