# 읽기 마감·로딩 복구·관리자 작업공간 계획

> 작성일: 2026-09-10
> 기준 체크포인트: `1d883fbeadabf6bbee3e10f44d7ded1a55c5d952`
> 상태 SSOT: 이 문서의 상태판과 작업 항목. 상태는 `미완료`·`진행중`·`보류`·`완료`만 쓴다.

## 배경과 승인 방향

이전 블로그 내비게이션·command palette 교정은 기준 체크포인트에 완료됐다. 후속 사용자 피드백은 공개 화면의 마감 세 가지와 관리자 작성 흐름의 재구성이다.

- 공개 footer가 본문 뒤에서 지나치게 높은 공간을 차지한다.
- route loading skeleton이 최종 화면의 위치와 형태를 충분히 닮지 않아 전환이 어색하다.
- 과거에 있던 중앙 `raven` 로고가 채워진 뒤 현재 header 왼쪽 wordmark로 이동하는 최초 진입 intro를 복구한다.
- 관리자는 충분히 넓은 화면에서 글 목록과 선택한 글 편집기를 한 화면에 함께 보고, 좁은 화면에서는 목록과 편집을 각각 독립 화면으로 사용한다.
- 승인 관리자 시안: [raven-admin-direction-v2.png](../../references/raven-admin-direction-v2.png)
- 공개 블로그의 승인 밀도 기준: [raven-blog-approved-direction.png](../../references/raven-blog-approved-direction.png)
- 두 시안은 방향과 정보 구조의 비교 자료이며 공개 콘텐츠나 그대로 복제할 UI 자산이 아니다.

## 확정 범위

### 공개 footer 압축

- 공개 footer의 브랜드 설명, 글·프로젝트·소개 링크, 저작권 정보는 유지한다.
- 현재 큰 상하 padding과 그룹 간 간격을 줄여 마지막 콘텐츠와 footer가 한 흐름으로 이어지게 한다. 긴 빈 면을 정보량으로 채우지 않는다.
- desktop과 mobile에서 link hit area와 keyboard focus는 유지하고, 긴 글·짧은 글·홈 모두에서 footer가 불필요하게 화면 한 구간을 차지하지 않게 한다.

### 최종 레이아웃을 닮는 loading skeleton

- 공통 `ArticleSkeleton`을 모든 route의 중립 fallback으로 재사용하지 않는다. 홈은 현재 추천·카테고리 grid와 sidebar, 블로그 목록은 archive layout, 상세는 `BlogShell`의 왼쪽 탐색과 cover/title/body, 프로젝트 목록·상세는 각 최종 구조, 관리자는 실제 workspace 구조를 닮은 route별 skeleton을 사용한다.
- skeleton의 container 폭, column 시작선, header 아래 offset, 예상 cover 비율과 읽기 폭을 최종 UI와 공유하거나 같은 token에서 파생한다. 로딩 완료 때 주요 블록이 좌우·상하로 튀지 않게 한다.
- 느린 네트워크에서도 의미 없는 가짜 문구를 보여주지 않고 `aria-busy`와 접근 가능한 로딩 이름을 제공한다. `prefers-reduced-motion`에서는 shimmer를 정지한다.

### 최초 진입 intro 복구

- `d84cb3c`의 `SiteIntro`, `IntroProvider`, pre-paint session 상태 결정 방식을 현재 root layout에 다시 연결한다. 현재 소스에 두 component는 남아 있지만 root layout과 provider 연결이 빠져 있다. 원래 설계와 구현 계획은 `docs/superpowers/specs/2026-07-06-ppos-masthead-reveal-loading-design.md`와 `docs/superpowers/plans/2026-07-06-masthead-reveal-loading.md`를 대조한다.
- 중앙에서 채워지는 text와 도착점은 모두 현재 header와 동일한 `raven` wordmark, font, weight, letter spacing을 사용한다. 과거 `raven.kr` text를 그대로 복구하지 않는다.
- 현재 `SiteHeader` wordmark에 측정 가능한 `data-site-wordmark` target을 복구하고, 실제 target rect를 기준으로 중앙 wordmark가 왼쪽 상단 header 위치와 크기에 정확히 착지한 뒤 실제 header로 넘긴다.
- 기존 `ppos:intro-shown` session key와 pre-paint `pending` gate를 유지해 최초 진입은 session당 한 번만 재생하고 cached navigation과 새로고침 반복 재생을 막는다. direct detail 진입에서도 같은 계약을 적용한다. storage 접근 실패와 animation 오류에는 콘텐츠를 즉시 공개한다.
- intro overlay 때문에 keyboard focus가 사라지거나 배경 interactive element에 먼저 도달하지 않게 한다. reduced motion에서는 animation 없이 최종 화면을 즉시 보여준다. hydration flash와 CLS를 만들지 않는다.

### 관리자 목록·편집 통합 작업공간

- 충분히 넓은 화면에서는 관리자 navigation, 최소 폭을 보장한 글 목록, 본문 읽기 폭을 보장한 편집기, 오른쪽 설정 rail을 한 화면에 둔다. breakpoint는 단순 device 이름이 아니라 `목록 약 360px + 편집 본문 최소 680px + 설정 약 300px + navigation·gap`이 실제 확보되는 폭에서 결정한다. 최종 구현은 1900px 이상에서 navigation 120px, 목록 360px, 본문 804px, 오른쪽 rail 300px을 확보하며 1920px QA에서 전체 구성을 적용한다.
- 1900px 미만에서는 기존 route 기반 목록과 편집 화면을 유지한다. 1600·1440·1280·390에서 세 column을 억지로 축소하거나 가로 scroll을 만들지 않는다.
- wide 목록에서 행을 선택하면 같은 workspace의 편집 pane이 바뀌며 URL은 선택한 글의 canonical admin route를 유지한다. 새 글도 같은 pane 계약을 사용한다. browser back/forward와 direct detail URL에서 선택 상태를 복원한다.
- narrow에서는 목록에서 글을 열어 별도 편집 화면으로 이동하고, 뒤로가기로 목록의 filter·scroll·선택 맥락을 복원한다.
- dirty 상태에서 다른 글 선택, 목록 복귀, browser navigation, 새 글 전환을 시도하면 접근 가능한 확인 절차로 저장하지 않은 변경을 보호한다. 저장 성공 뒤에는 경고를 해제하고 저장 실패 때는 현재 입력과 dirty 상태를 유지한다.

### 본문 우선 편집과 설정 rail

- 편집의 중심은 Markdown textarea와 preview다. title·description 다음에 Markdown/preview toolbar와 큰 본문 영역이 오고, preview는 현재 공개 article renderer와 같은 결과를 보여준다.
- 오른쪽 rail에는 상태, category, tags, slug·검색 정보, cover 선택·crop position·alt를 관련 그룹으로 배치한다. cover preview와 crop 조절 결과가 즉시 일치해야 한다.
- 저장과 공개는 명시적 action이다. 자동 저장처럼 오인시키지 않고 dirty, saving, saved, validation error, upload 상태를 명확히 보여준다. 공개 action은 현재 status·published timestamp 계약을 유지한다.
- keyboard로 목록 선택, editor toolbar, write/preview 전환, settings, 저장·공개와 dirty guard를 사용할 수 있어야 한다. pane 전환 때 focus를 새 문맥의 제목이나 오류 요약으로 예측 가능하게 옮긴다.

## 유지해야 할 데이터·보안 계약

- 기존 slug normalize와 변경 동작, Markdown sanitization/preview, category DB 정렬, tags 정규화, cover upload·crop·alt, pin 최대 5개 계약을 유지한다.
- 공개 API는 bounded 응답, literal query escape, `published` only와 privacy 경계를 유지한다. draft·owner preview는 방문자 cache에 섞지 않는다.
- 저장 성공 뒤 공개 server cache와 browser Query cache invalidation 계약을 유지한다. 저장 성공과 cache 갱신 실패를 구분하는 기존 결과도 보존한다.
- 관리자 auth, owner allowlist, RLS, upload key 검증과 S3/R2 목록 보안은 변경하지 않는다.
- QA는 새 격리 fixture에서만 수행하고 기존 local Supabase나 실사이트 데이터를 읽기 외 목적으로 변경하지 않는다.

## 상태판

| ID       | 작업                                   | 상태    | 선행 작업                      |
| -------- | -------------------------------------- | ------- | ------------------------------ |
| PLAN     | 피드백·관리자 방향·검증 SSOT           | 완료    | 없음                           |
| HANDOFF  | 새 primary Codex에 전체 맥락 전달      | 완료    | PLAN                           |
| FOOTER   | 공개 footer 높이와 간격 압축           | 완료    | HANDOFF                        |
| SKELETON | route별 최종 레이아웃 대응 skeleton    | 완료    | HANDOFF                        |
| INTRO    | 중앙 wordmark→현재 header intro 복구   | 완료    | HANDOFF                        |
| ADMIN    | responsive 목록·편집 통합 workspace    | 완료    | HANDOFF                        |
| QA       | 실제 화면·접근성·데이터 경계·회귀 검증 | 완료    | FOOTER, SKELETON, INTRO, ADMIN |
| RELEASE  | commit·push·deploy                     | 진행 중 | 사용자 승인에 따른 commit·push |

## 작업 항목

### PLAN — 피드백·관리자 방향·검증 SSOT

- **상태:** 완료
- **완료 기준:** 사용자 피드백 세 가지, 관리자 wide/narrow 동작, 기존 편집·데이터·보안 계약과 검증 기준이 저장소 문서에 남는다.
- **증거:** 관리자 시안 v2를 1585×992 PNG로 직접 확인하고 문서 자산으로 보존했다. 현재 root layout, `SiteHeader`, `SiteIntro`·`IntroProvider`, loading routes, footer, `AdminWorkspace`·`PostList`·`PostEditor`와 관련 `d84cb3c`·`b8a6469` 이력을 확인해 계획에 반영했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### HANDOFF — 새 primary Codex에 전체 맥락 전달

- **상태:** 완료
- **완료 기준:** 같은 checkout의 새 primary Codex가 이 계획 전체와 두 승인 이미지를 직접 확인하고 현재 checkpoint·승인 경계를 전달받는다.
- **증거:** 새 primary가 기준 HEAD `1d883fbeadabf6bbee3e10f44d7ded1a55c5d952`, 이 계획 전체, 관리자·공개 블로그 승인 PNG 두 장과 commit·push·deploy 승인 경계를 직접 확인했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### FOOTER — 공개 footer 압축

- **상태:** 완료
- **완료 기준:** 브랜드·내비게이션·저작권과 link 접근성을 유지하면서 홈·긴 상세·짧은 상세·mobile에서 footer의 과도한 높이와 공백이 제거된다.
- **증거:** 격리 앱에서 1920·1600·1440·1280 footer 높이 `139.09px`, 390에서 `223.09px`를 측정했고 wordmark·글·프로젝트·소개 link hit area가 모두 44px임을 확인했다. 부모가 desktop/mobile footer 캡처와 keyboard focus를 직접 검토해 브랜드·내비게이션·저작권 정보가 유지된 compact 결과를 승인했다. 측정값과 캡처는 `/private/tmp/raven-reading-qa-artifacts/public-metrics.json`, `footer-{1920,1600,1440,1280,390}.png`에 남겼다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### SKELETON — route별 최종 레이아웃 대응

- **상태:** 완료
- **완료 기준:** 홈, 블로그 목록·상세, 프로젝트 목록·상세, 관리자 loading이 각 최종 layout의 폭·열·시각 시작점을 유지하고 reduced motion을 지원한다.
- **증거:** 공개 홈·archive는 query-aware fallback과 실제 `BlogShell`·featured·grid geometry를 사용하고, blog 상세는 중립 route fallback 뒤 post·category·Markdown·TOC를 확보한 data-aware fallback에서 실제 cover 유무, `ArticleHeader`, desktop/mobile TOC와 share rail을 고정한다. 격리 지연 proxy로 cover 글 `qa-ai-1`과 no-cover 글 `qa-design-4`를 1920·1600·1440·1280·390에서 확인했으며 loading→final header x/y/width/height, heading 시작점, cover 유무·rect와 share rect가 일치했다. 기존 no-cover 제목의 425px 이동을 제거했다. 프로젝트 상세도 1280에서 x=290/y=65/w=700, 390에서 x=24/y=65/w=342로 final과 loading 시작점·폭이 일치했고 reduced motion에서 `animation-name: none`, `0s`를 확인했다. 관리자 loading은 부모가 `/private/tmp/raven-reading-qa-artifacts/admin-loading-5width.log`와 1920·390 캡처를 직접 확인했다. 1920·1600·1440·1280의 body x/y/width/height는 final과 delta 0, 390은 x/width/height가 일치하고 y 차이는 0.78125px이며 모든 폭에서 overflow는 0이었다. loading header·3개 row와 upload label 속성 보완 뒤 영향 범위 관리자 6개 파일 26개 테스트, typecheck, target ESLint, CSS 65개, design 21개와 최신 clean production build가 통과했다. 공개 증거는 `/private/tmp/raven-reading-qa-artifacts/data-skeleton-metrics.json`, `data-qa-{ai-1,design-4}-loading-{1600,390}.png`, `project-smoke.json`과 `project-detail-{1280,390}.png`에 남겼다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### INTRO — 최초 진입 wordmark handoff

- **상태:** 완료
- **완료 기준:** session 첫 진입에서 현재 `raven`이 중앙에서 채워져 실제 header wordmark rect로 정확히 이동한다. 반복 navigation에는 재생하지 않고 direct detail, storage/animation failure, reduced motion, keyboard focus와 no-CLS 계약을 충족한다.
- **증거:** 현재 header와 같은 `raven` text·font·weight·spacing을 사용하고 실제 `[data-site-wordmark]` rect를 측정하는 intro 연결을 복구했다. fresh session, cached navigation, direct detail, reduced motion, storage/animation failure fallback과 keyboard focus를 1920·1600·1440·1280·390에서 검증했다. production browser 67/67 시나리오가 통과했고 landing rect 오차는 모든 축에서 0.005px 이하, 측정 CLS는 0이었다. failure fallback에서도 pending gate가 해제되고 콘텐츠가 노출됨을 확인했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### ADMIN — responsive 목록·편집 통합 workspace

- **상태:** 완료
- **완료 기준:** 실제 열 최소 폭이 확보되는 1900px 이상에서 목록·editor·settings를 함께 보여주고 1600px 이하에서는 route별 목록/편집을 유지한다. Markdown/preview, category, tags, slug, cover/crop/alt, 명시적 save/publish와 dirty guard가 keyboard·URL·back/forward와 함께 동작한다.
- **증거:** wide workspace와 narrow route 화면 구현 뒤 부모가 production 1920·390 기존 글·새 글 화면을 직접 확인했다. 본문 pane은 1920에서 top=466.25px/width=804px, 390에서 top=578.25px/width=342px이었고 overflow나 save action 겹침이 없었다. same-URL navigation guard 보완 뒤 새 글 생성→canonical detail URL replace→두 번째 저장→publish→dirty browser back에서 cancel 1회로 URL·입력 보존→accept 뒤 목록 복귀 lifecycle가 실제 production에서 통과했다. `/private/tmp/raven-reading-qa-artifacts/admin-new-lifecycle-persistence.log`에서 API HTTP 200, published 상태, 두 번째 저장 본문 영속화와 저장하지 않은 dirty title 미영속화를 확인했다. `admin-context-loading.log`에서는 non-empty `Lifecycle QA` 검색 결과 10개, 목록 scroll 420px→detail 0px→Back 뒤 query 유지와 목록 420px 복원을 확인했다. 1920·1600·1440·1280·390 final 화면, focus, keyboard preview 전환과 overflow 0도 통과했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### QA — 실제 화면·접근성·데이터 경계·회귀

- **상태:** 완료
- **완료 기준:** fresh 첫 진입·느린 네트워크·cached navigation·direct detail에서 intro와 skeleton의 연결, logo 착지 좌표, CLS, reduced motion, focus를 검증한다. 관리자 wide/narrow, URL/back, dirty guard, Markdown preview, 저장·공개·설정과 public cache/privacy를 격리 fixture로 검증한다.
- **증거:** 새 격리 앱 `3503`과 Supabase API `54521` fixture에서 최신 전체 67개 파일 326개 테스트, typecheck, lint 오류 0·기존 경고 4, CSS 65개, design 21개를 통과했고 repo↔QA source content diff는 0이었다. webpack production build는 compile·typecheck·page data·13개 static page 생성을 포함해 clean 성공했고 production intro browser 67/67 및 공개 footer·loading·home density·project smoke를 통과했다. 관리자 production 5개 폭 final·loading geometry, focus, keyboard preview, overflow 0, 새 글 create/save/publish·same-URL dirty back cancel/accept lifecycle, API persistence와 non-empty 검색·scroll 복원도 통과했다. 공개·관리자 증거는 `/private/tmp/raven-reading-qa-artifacts`에 보존했다. 모든 브라우저 QA는 격리 서비스 `3503`·`54521`에서 수행했으며 기존 `3500`과 `54321` 서비스는 변경하거나 종료하지 않았다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### RELEASE — commit·push·deploy

- **상태:** 진행 중
- **완료 기준:** 구현과 QA가 끝난 뒤 사용자가 각각 승인한 commit·push만 실행한다. manual production deploy는 이 계획 범위에 없다.
- **증거:** 사용자가 2026-09-10 이번 신규 변경의 commit·push를 명시적으로 승인했다. 원격 `dev` 관계와 전체 diff를 확인한 뒤 commit·push를 진행한다.
- **배포:** manual production deploy는 실행하지 않는다.

## Handoff 메모

- 기준 checkpoint는 `1d883fbeadabf6bbee3e10f44d7ded1a55c5d952`이며 작성 시점 `dev`와 `origin/dev`가 같고 worktree는 clean이었다.
- 사용자는 이번 단계에서 계획 수립과 새 Codex handoff를 요청했다. 새 Goal 생성은 명시하지 않았으므로 자동 생성하지 않는다.
- 새 Codex는 사용자가 직접 요청한 새 primary 세션이다. 하위 에이전트로 취급하지 않으며 제공된 `AGENTS.md`에 따라 자체 session runtime snapshot을 한 번 조회한다.
- 같은 checkout을 사용한다. 새 worktree를 만들거나 기존 primary terminal을 재사용하지 않는다.
- `/tmp/raven-redesign-browser/node_modules/playwright/index.mjs`와 `/tmp/raven-navigation-qa-*` script·image는 남아 있다. 이전 3502와 격리 544xx 서비스는 종료됐고 3500과 기존 54321 `api` Supabase는 건드리지 않는다.
- 관리자 검증은 새 격리 fixture만 사용한다. 기존 private preview·CMS 검증은 baseline이며 새로 실행하지 않았다면 새 증거로 주장하지 않는다.
- 이전 담당의 계획·인계 준비 단계는 앱 코드 변경 없이 종료한다. 새 primary는 사용자가 이미 승인한 수정 진행 범위에 따라 추가 승인 없이 구현과 검증을 이어간다. 신규 변경의 commit·push와 manual deploy는 별도 사용자 승인 전까지 실행하지 않는다.

## 상태 갱신 규칙

작업을 시작할 때 해당 항목을 `진행중`으로 바꾸고 완료 기준과 증거가 채워진 뒤에만 `완료`로 바꾼다. 시작하지 않은 작업은 `미완료`다. 외부 결정이나 명시적 승인을 기다리는 작업만 `보류`로 두고 재개 조건을 함께 적는다.
