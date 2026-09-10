# 블로그 내비게이션과 command palette 교정 계획

> 작성일: 2026-09-10
> 기준 체크포인트: `946b0c646e8d365b3f1b6e388f1539b5523a2846`
> 상태 SSOT: 이 문서의 상태판과 작업 항목. 상태는 `미완료`·`진행중`·`보류`·`완료`만 쓴다.

## 배경과 승인 방향

Channel형 홈·상세 레이아웃의 기능과 검증은 기준 체크포인트에 보존됐지만 사용자가 두 번째 시각 결과를 반려했다. 사용자는 새 이미지 시안의 방향을 승인했으며, 이번 작업은 그 밀도와 상세 정보 구조를 실제 Raven 기능에 맞게 구현한다.

- 승인 시안: [raven-blog-approved-direction.png](../../references/raven-blog-approved-direction.png)
- 기존 비교 자료: [Channel 홈](../../references/channel-blog-home-reference.png), [Channel 상세](../../references/channel-blog-detail-reference.png)
- 승인 시안과 Channel 캡처는 구현 비교용 문서 자산이다. 공개 사이트 이미지로 사용하지 않는다.
- 시안의 글 제목, cover, 메뉴와 Channel의 광고·로고·채팅 위젯은 실제 기능이나 복제 대상이 아니다. Raven 브랜드와 실제 DB 콘텐츠를 사용한다.
- Day0 토큰, Pretendard, 톤다운 블루, Base UI, CSS Modules와 sticky blur header를 유지한다.

## 확정 범위

### 공통 header와 command palette

- 공통 header는 Raven 로고와 검색 input처럼 보이는 command palette trigger만 남긴다. 소개·프로젝트 등 기존 header 메뉴는 제거하되 해당 페이지로 가는 기능은 palette에 보존한다.
- 홈과 상세를 포함한 공통 sidebar에서 기존 검색을 제거하고 검색 진입점을 header palette로 통합한다.
- trigger click, `Cmd+K`, `Ctrl+K`로 모든 페이지에서 palette를 열고 `Escape`로 닫는다. 방향키로 항목을 선택하고 `Enter`로 이동한다. 닫힌 뒤 focus는 호출 직전 요소로 복귀한다. 클릭으로 열었으면 trigger, 단축키로 열었으면 원래 focus로 돌아가며 결과 이동 시에는 새 페이지가 focus를 관리한다.
- palette는 글 검색과 홈, DB categories, 소개, 프로젝트 바로가기를 제공한다. 전체 글을 브라우저로 내려 검색하지 않고 기존 공개 API와 Query cache를 사용한다.
- Base UI `Dialog`를 기반으로 구현하되 Base UI에 command 전용 primitive가 있다고 가정하지 않는다. 설치된 버전의 실제 API를 확인한 뒤 combobox/listbox 의미와 keyboard 동작을 직접 구성한다.
- IME 조합 중 단축키·Enter를 가로채지 않는다. loading, empty, error와 mobile viewport를 포함하고 검색 input의 label, active descendant 또는 동등한 접근성 관계를 제공한다.
- 기존 debounce, literal query escape, URL authority, published-only 조회, privacy 경계, server cache invalidation, Query cache와 최초 SSR 중복 요청 0 계약을 보존한다.

### 상세의 단일 왼쪽 탐색 축

- 상세 화면의 왼쪽 sticky 영역 하나에 `홈 → 현재 category → 다른 categories 접기 → 목차` 순서로 배치한다. 다른 categories는 기본으로 접는다.
- sticky 영역은 header 아래에서 따라오며 내용이 viewport보다 길면 내부만 scroll한다. sidebar 검색은 제거한다.
- 기존 오른쪽 TOC를 제거하고 공유 기능은 보존한다. desktop 본문 시작선과 읽기 폭, mobile 한 열 흐름을 새 왼쪽 축에 맞춰 다시 조정한다.
- 모바일에서는 탐색과 목차를 접근 가능한 접이식 UI로 제공한다. keyboard, focus 이동, 현재 위치 표시와 anchor 이동을 검증한다.
- slug, metadata, private preview, published-only 보안, related/navigation, cover-first와 no-cover 흐름은 유지한다.

### 홈 밀도 교정

- 승인 시안처럼 추천 영역과 카테고리 section의 간격·카드 크기·타입 위계를 더 촘촘하게 다듬는다.
- 각 글은 실제로 서로 다른 cover와 저장된 crop position을 사용한다. 같은 label이나 설명을 반복해서 시각 밀도를 채우지 않는다.
- DB category 정렬을 그대로 따른다. 빈 category는 숨기고 각 section은 최신 글 최대 3개만 보여준다.
- 기존 수동 pin 우선 최대 5개, 무핀일 때 category별 최신 글 fallback, featured carousel, cover crop, 관리자 편집, S3/R2 목록 보안 계약을 유지한다.

## 구현 경계

- 공개 검색은 기존 literal escape를 그대로 사용하며 query text를 SQL/PostgREST 표현에 직접 삽입하지 않는다.
- palette 결과와 홈 section은 bounded API 응답만 사용한다. 공개 전체 글 목록을 client state에 적재하지 않는다.
- palette는 모든 공개 페이지에서 사용할 수 있어야 하며 기존 route와 canonical을 바꾸지 않는다.
- 기준 체크포인트의 private preview·CMS·cache 검증은 baseline이다. 새 변경이 경계를 건드리면 관련 회귀 테스트를 다시 실행한다.

## 상태판

| ID         | 작업                                 | 상태   | 선행 작업                 |
| ---------- | ------------------------------------ | ------ | ------------------------- |
| DOC        | 승인 방향·범위·검증 SSOT             | 완료   | 없음                      |
| HANDOFF    | 새 Codex 세션에 전체 맥락 전달       | 완료   | DOC                       |
| PALETTE    | 전역 command palette와 header 단순화 | 완료   | HANDOFF                   |
| DETAIL-NAV | 상세 왼쪽 sticky 탐색·목차           | 완료   | HANDOFF                   |
| HOME       | 승인 시안 기준 홈 밀도 교정          | 완료   | HANDOFF                   |
| QA         | 실제 fixture·시각·접근성·회귀 검증   | 완료   | PALETTE, DETAIL-NAV, HOME |
| RELEASE    | 추가 commit·push와 별도 deploy       | 진행중 | QA, 사용자 승인           |

## 작업 항목

### DOC — 승인 방향·범위·검증 SSOT

- **상태:** 완료
- **완료 기준:** 승인 시안, 반려 맥락, 실제 기능과 시안의 경계, 내비게이션·palette·홈 교정 범위와 acceptance가 저장소 문서에 남는다.
- **증거:** 승인 시안을 1536×1024 PNG 문서 자산으로 보존하고 이 계획과 README 링크를 작성했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### HANDOFF — 새 Codex 세션에 전체 맥락 전달

- **상태:** 완료
- **완료 기준:** 새 primary Codex가 이 계획과 기준 체크포인트를 읽고 사용자 승인으로 Goal을 만든 뒤 상태를 단계별로 갱신한다.
- **증거:** 새 primary Codex가 2026-09-10에 이 계획 전체와 기준 체크포인트를 읽고 Goal `01a0894a-c2d6-7330-bb9b-9c126d1d17fc`(현재 checkout에서 palette·상세 탐색·홈 밀도 구현과 실제 fixture·회귀 검증, commit/push/deploy 제외)를 생성했다. 승인 시안(1536×1024), Channel 홈(1363×2073), Channel 상세(1644×2071) 세 PNG도 원본 크기로 직접 열어 확인했다.
- **보류 사유/재개 조건:** 해당 없음.

### PALETTE — 전역 command palette와 header

- **상태:** 완료
- **완료 기준:** 모든 페이지의 header trigger와 `Cmd/Ctrl+K`, Escape, 방향키, Enter, focus 복귀가 동작한다. bounded 글 검색과 정적·category 바로가기를 제공하고 IME·mobile·loading·empty·error 및 combobox/listbox 접근성을 검증한다.
- **증거:** Base UI Dialog 기반 palette를 공통 header에 구현하고 기존 메뉴와 sidebar 검색을 통합했다. production browser에서 홈·상세·소개·프로젝트 각각 click·Escape·호출 요소 focus 복귀를 확인했고, 홈에서 Cmd/Ctrl+K·방향키·Enter·IME 조합 중 Enter 무시를 검증했다. mobile, loading·empty·error와 combobox/listbox 관계도 통과했다. 안정 상태 캡처는 `/tmp/raven-navigation-qa-artifacts/final-palette-1440-stable.png`, `final-palette-390-stable.png`, `final-palette-loading-1280.png`, `final-palette-error-1280.png`에 남겼다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### DETAIL-NAV — 상세 왼쪽 sticky 탐색·목차

- **상태:** 완료
- **완료 기준:** 홈, 현재 category, 기본 접힘 categories, TOC가 header 아래 하나의 sticky·내부 scroll 영역으로 동작한다. 오른쪽 TOC는 제거하고 공유 기능과 mobile 접이식 탐색·목차를 보존한다.
- **증거:** 상세 navigation을 왼쪽 단일 sticky 축으로 합치고 desktop TOC 기본 열림, mobile TOC 기본 접힘과 mobile menu 내부 scroll을 구현했다. 28개 heading fixture에서 sidebar `scrollHeight 1137 > clientHeight 588`, 내부 scroll, anchor URL·현재 위치·heading focus를 확인했고 no-cover 짧은 글도 빈 cover 공간 없이 렌더링됐다. 캡처는 `/tmp/raven-navigation-qa-artifacts/final-detail-1440-sticky-scroll.png`, `final-detail-long-toc-scroll-1280.png`, `final-detail-no-cover-short-1280.png`에 남겼다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### HOME — 승인 시안 기준 밀도 교정

- **상태:** 완료
- **완료 기준:** 승인 시안의 촘촘한 정보 밀도와 실제 서로 다른 cover를 반영하고 반복 label을 제거한다. DB 정렬, sections 최대 3개, pin/fallback carousel과 cover crop 계약을 유지한다.
- **증거:** 실제 길이가 다른 기술 글 16개, DB 순서의 4개 category, 서로 다른 cover 15개와 no-cover 1개인 격리 fixture로 추천과 category별 최대 3개 section의 밀도·줄바꿈·crop을 확인했다. 수동 pin 2개 API 결과를 확인하고 pin을 해제한 뒤 4개 category별 최신 글 fallback을 확인한 다음 복구했다. 1280·1440·390 첫 viewport와 1440 full page는 `/tmp/raven-navigation-qa-artifacts/final-home-*-viewport.png`, `final-home-1440-sections-scroll.png`, `final-home-1440-full.png`에 남겼다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### QA — 실제 fixture·시각·접근성·회귀

- **상태:** 완료
- **완료 기준:** 실제 multi-category·서로 다른 cover fixture로 1280px, 1440px, 390px 화면을 승인 시안과 비교한다. palette를 홈·상세·소개·프로젝트에서 열고 click/shortcut/Escape/arrows/Enter/focus 복귀/IME/mobile을 확인한다. 검색·URL·back, manual pin·fallback, empty/loading/error, 최초 SSR 중복 요청 0, published/privacy/cache invalidation과 기존 checks를 검증한다.
- **증거:** 새 구현에서 전체 65개 파일 307개 테스트, typecheck, CSS 58개, design 19개, `git diff --check`를 통과했다. lint는 오류 0개·경고 4개였고, page helper의 Next 허용 export 위반을 별도 module로 옮긴 뒤 최신 소스의 production build가 성공했다. 격리 Supabase(`raven-navigation-qa-supabase`, API 54421)의 공개 글 16개·draft 1개에서 공개 API가 draft를 상세 404·검색 제외로 유지함을 확인했다. production browser 자동 검증 33개와 long TOC·no-cover·privacy 검증 11개를 통과했고 홈 최초 SSR `/api/posts` 중복 요청은 세 viewport 모두 0건이었다. 상세 공유는 desktop/mobile에서 현재 URL 복사를, 전체 글 page 2·sidebar 홈·browser back URL 복원을 별도 browser 검사로 통과했다. private preview와 CMS 저장 보안은 기준 체크포인트 baseline이며 이번 변경에서 새 실행했다고 주장하지 않는다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### RELEASE — 추가 commit·push와 별도 deploy

- **상태:** 진행중
- **완료 기준:** 새 구현과 QA 결과를 의미 단위로 commit하고 `origin/dev`에 push한다. 수동 deploy는 별도 승인 전까지 실행하지 않는다.
- **증거:** 사용자가 2026-09-10에 의미 단위 commit과 push를 명시적으로 승인했다. `dev` push는 저장소의 `deploy-dev` workflow를 시작하며, 이는 승인된 push의 기존 자동 동작이다.
- **보류 사유/재개 조건:** commit과 push는 진행한다. 별도 수동 deploy는 사용자가 명시적으로 지시할 때만 재개한다.

## Handoff 메모

- 새 primary Codex는 사용자의 현 세션 승인에 따라 Goal을 생성하고 이 문서의 상태판과 작업 본문을 같은 변경에서 갱신한다.
- 현재 세션에서 발행된 subagent 정책 snapshot은 재조회하지 않는다. 새 세션의 primary는 사용자가 제공한 `AGENTS.md` 지침에 따라 자체 세션 정책을 처리한다.
- 인계 당시 기준 체크포인트는 `946b0c6`이었고, 그 시점에는 그 뒤로 이 계획과 참조 이미지 문서 변경만 있었다.
- 이전 private QA 서버 3502/3503과 격리 Supabase는 종료됐다. 3501 preview가 남아 있을 수 있으므로 점유 상태를 확인하고, 필요하면 기존 `/tmp` Playwright 도구를 재사용한다.
- 이전 문서 작성 단계에서는 코드, Goal, commit, push, deploy를 실행하지 않았다. 이후 새 primary Goal에서 이 문서의 승인 범위만 구현·검증했으며 commit, push, deploy는 실행하지 않았다.

## 상태 갱신 규칙

작업을 시작할 때 해당 항목을 `진행중`으로 바꾸고 완료 기준과 증거가 채워진 뒤에만 `완료`로 바꾼다. 시작하지 않은 작업은 `미완료`다. 외부 결정이나 명시적 승인을 기다리는 작업만 `보류`로 두고 재개 조건을 함께 적는다.
