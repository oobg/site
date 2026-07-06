# 상태 모델 컨벤션

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §6.

## 상태 기준 표

| 용도                    | 저장소                | 이번 마일스톤                  |
| ----------------------- | --------------------- | ------------------------------ |
| 읽기 전용 정적 콘텐츠   | **RSC 서버 fetch**    | ✅ 사용                        |
| 검색·필터·폼·무한스크롤 | TanStack Query        | 설치 + Provider만, 사용은 이후 |
| UI 상태                 | Zustand               | 이후(설치도 이후)              |
| URL 상태                | nuqs                  | 이후(설치도 이후)              |
| 폼                      | react-hook-form + zod | 이후(설치도 이후)              |

## 선택 가이드

- 정적 콘텐츠(posts, projects)는 **RSC 서버 fetch** — TanStack Query 불필요.
- 상호작용(검색·필터·무한스크롤)이 생길 때 TanStack Query를 `*.query.ts`의 `queryOptions`로 추가.
- 전역 UI 상태(모달·사이드바 토글 등)는 Zustand. 페이지별 URL 상태는 nuqs.
- 판단이 애매하면 가장 좁은 범위(컴포넌트 로컬 `useState`)로 시작하고 필요 시 승격.

## 폼 컨벤션 (이후 사용 시)

- `react-hook-form` + `zod` 고정.
- 에러 메시지는 한국어.
- 제출 피드백은 반드시 아래 Toast 규칙을 따른다.

## Toast 규칙

- 사용자 피드백은 `Toast.success(msg)` / `Toast.error(msg)` (`@lib/toast`) 만 사용.
- **`sonner` 직접 import 금지** — ESLint로 강제.
- `AppProviders`에 `<Toaster />`만 배선(sonner Provider). 래퍼는 `@lib/toast`.

## 안티패턴

- **서버 데이터를 Zustand에 복사 금지.** RSC에서 받은 데이터를 클라이언트 store에 넣지 않는다.
- `*.api.ts`(`server-only`)를 클라이언트 번들에서 import 금지. 클라이언트 재요청이 필요하면 Route Handler 프록시 또는 공개 API 직접 호출.
- `AppProviders`는 최소 유지 — `QueryClientProvider + Toaster`만. nuqs 어댑터 등은 필요 시 추가.
