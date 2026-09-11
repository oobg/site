# Channel 블로그 레이아웃 교정 계획과 상태

> 작성일: 2026-09-10
> 기준 체크포인트: `f5e0139fcbfa218013cc0fd9d92ac5ad9490735c`
> 상태 SSOT: 이 문서의 상태판과 작업 항목. 상태는 `미완료`·`진행중`·`보류`·`완료`만 쓴다.

## 배경과 목표

Day0 블로그 전면 개편은 기능·데이터·관리자 흐름과 검증을 완료했지만, 사용자가 홈과 상세의 시각 결과를 반려했다. 이번 작업은 완료된 기능을 보존하면서 제공된 Channel 기술 블로그 캡처의 정보 구조와 밀도에 맞춰 공개 홈과 상세 레이아웃을 다시 구성한다. 레이아웃 판단은 캡처를 우선하고, 기존 Day0 디자인 토큰·Pretendard·톤다운 블루·Base UI·CSS Modules는 그대로 사용한다.

- 홈 참조: [channel-blog-home-reference.png](../../references/channel-blog-home-reference.png)
- 상세 참조: [channel-blog-detail-reference.png](../../references/channel-blog-detail-reference.png)
- 참조 이미지는 구현 비교용 문서 자산이다. 공개 사이트 이미지, 로고, 콘텐츠 또는 배경으로 사용하지 않는다.
- Channel의 광고 배너, 브랜드 로고, 외부 링크, 채팅 위젯은 복제하지 않는다.
- 기존 sticky header와 blur 동작은 유지한다.

## 캡처에서 확인한 구조

데스크톱은 약 1200px의 공통 shell 안에서 216–224px sidebar와 32–40px gap을 둔 오른쪽 콘텐츠 영역으로 나뉜다. 홈의 오른쪽 `추천 글` 영역은 큰 대표 카드와 최근 글 3개 행을 하나의 묶음으로 보여준다. 대표 이미지는 약 60%, 제목·요약·메타는 약 40%를 차지한다. divider 아래에는 각 카테고리의 제목·모두 보기·최신 글 3개 묶음이 반복된다.

상세도 같은 sidebar와 콘텐츠 시작선을 공유한다. cover가 제목보다 먼저 나오고, 제목·요약·작성자·날짜·읽기 시간·태그·본문 순으로 읽힌다. 본문은 약 640~700px 너비를 유지하며 오른쪽에는 작은 공유 rail과 TOC가 놓인다. cover가 없는 글에는 큰 placeholder 영역을 만들지 않는다.

## 확정 동작

### 공통 shell과 탐색

- 데스크톱 shell 최대 너비는 약 1200px다. sidebar는 216–224px, 콘텐츠와의 간격은 32–40px 범위에서 캡처 비율로 결정한다.
- sidebar는 데스크톱에서 sticky로 유지하며 `기술 블로그`, `홈`, DB 카테고리, 검색 순서로 탐색을 제공한다.
- tablet에서 너비가 부족해지면 sidebar를 접는다. 모바일에서는 Base UI 기반 접이식 메뉴와 검색을 제공하고 본문은 한 열로 만든다.
- sidebar와 모바일 메뉴의 카테고리는 DB 정렬 순서를 따른다. 공개 글이 없는 카테고리는 숨긴다.
- keyboard 탐색, focus-visible, reduced motion과 기존 URL 공유 동작을 보존한다.

### HOME

- 기본 홈은 오른쪽 영역에 `추천 글` 제목과 대표 carousel을 먼저 배치한다. 대표 카드의 데스크톱 비율은 이미지 약 60%, 텍스트 약 40%이며 제목은 약 32px급 위계로 표현한다.
- 대표 글 다음에는 같은 추천 영역 안에 최신 글 3개를 한 행으로 배치한다. 별도의 큰 `최근 글` 제목이나 설명은 추가하지 않는다.
- 추천 영역 뒤 divider를 두고 DB 카테고리 정렬 순서대로 `카테고리 제목 + 모두 보기 + 최신 글 3개` 섹션을 반복한다. 빈 카테고리는 렌더링하지 않는다.
- 대표 선정은 기존 규칙을 유지한다. 수동 pin이 있으면 pin 순서만 최대 5개, pin이 없으면 카테고리별 최신 1개를 모아 최신순·slug 동률 순으로 최대 5개를 고른다.
- 필터가 모두 해제된 `/`만 위 홈 구성을 쓴다. `/?view=all`은 전체 글, `/?category=<slug>`는 해당 주제 모두 보기다.
- `q`, `category`, `tag`, `view=all` 또는 `page>1`이 있으면 전체 pagination archive를 보여준다. 기본 홈에서 전체 글로 가는 링크는 `/?view=all`, 카테고리 모두 보기는 `/?category=<slug>`를 사용한다. 검색이나 필터 변경 시 page는 1로 돌아간다.
- 초기 중복 fetch 0, 검색 focus 유지, URL 복원과 browser back 동작을 유지한다.

### DETAIL

- 홈과 동일한 shell, sidebar 너비, gap, 콘텐츠 시작선을 사용한다.
- 정보 순서는 `cover → title → summary → author/date/reading time → tags → body`로 정한다.
- cover가 없으면 큰 placeholder를 제거하고 제목부터 시작한다.
- 본문은 약 640~700px로 제한한다. 오른쪽에는 작은 share rail과 TOC를 유지하고, 모바일에서는 기존 접근 가능한 접이식 TOC로 전환한다.
- 기존 slug, canonical·metadata·sitemap, related/navigation, owner private preview와 공개 cache 경계를 보존한다.

### DATA와 조회 경계

- `BlogHomeData`에 DB 정렬 순서의 `sections`를 추가한다. 각 section은 category와 공개 최신 글 최대 3개를 가진다.
- category shell/featured 데이터와 함께 공유 가능한 서버 cache에 포함하고, 관련 mutation의 hard invalidation에 연결한다.
- 브라우저에 전체 공개 글 목록을 내려 홈 섹션을 만들지 않는다. 서버에서 bounded query로 section당 최대 3개만 가져온다.
- `view`는 기본 홈과 archive를 전환하는 UI 표시 상태다. Query key나 DB filter를 추가하지 않고 동일한 archive cache를 재사용한다.
- 수동 pin이 없을 때의 자동 featured는 section별 최신 글 결과를 재사용할 수 있다.
- mock, API compatibility, Supabase 구현은 같은 공개 결과 의미를 유지한다.

## 상태판

| ID         | 작업                                    | 상태 | 선행 작업           |
| ---------- | --------------------------------------- | ---- | ------------------- |
| CHECKPOINT | 기존 Day0 구현 체크포인트               | 완료 | 없음                |
| DOC        | 후속 계획·참조·상태 SSOT                | 완료 | CHECKPOINT          |
| DATA       | `BlogHomeData.sections`와 bounded query | 완료 | DOC                 |
| SHELL      | 공통 sidebar/content 반응형 shell       | 완료 | DOC                 |
| HOME       | 추천·최근·카테고리별 홈 레이아웃        | 완료 | DATA, SHELL         |
| DETAIL     | 동일 shell 기반 상세 읽기 레이아웃      | 완료 | SHELL               |
| VISUAL     | 참조 캡처 비교와 반응형·상호작용 교정   | 완료 | HOME, DETAIL        |
| QA         | 실제 fixture 회귀·전체 검사·문서 동기화 | 완료 | DATA, VISUAL        |
| COMMIT     | 레이아웃 교정 로컬 체크포인트 commit    | 완료 | QA, 사용자 승인     |
| RELEASE    | push·deploy                             | 보류 | COMMIT, 사용자 승인 |

## 작업 항목

### CHECKPOINT — 기존 Day0 구현 체크포인트

- **상태:** 완료
- **완료 기준:** 사용자 시각 교정 전에 완료된 기능·검증 이력을 독립된 커밋으로 보존한다.
- **증거:** `f5e0139fcbfa218013cc0fd9d92ac5ad9490735c` (`feat(blog): Day0 블로그 개편 및 콘텐츠 관리 기능 추가`). 커밋 훅 통과와 clean worktree를 확인했다.
- **보류 사유/재개 조건:** 해당 없음.

### DOC — 후속 계획·참조·상태 SSOT

- **상태:** 완료
- **완료 기준:** 사용자 반려 사유를 기능 퇴행 없이 실행할 수 있는 레이아웃·데이터·검증 단위로 나누고, 제공된 홈·상세 캡처를 저장소 참조 자산으로 보존한다. README와 이전 계획에서 이 문서를 찾을 수 있고 부모 검토를 통과해야 한다.
- **증거:** 홈·상세 원본 캡처를 직접 확인해 문서 자산으로 복사하고 후속 계획과 README·이전 계획 링크를 작성했다. 부모 검토에서 구조·상태·검증 gate를 승인했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### DATA — 홈 section 데이터와 bounded query

- **상태:** 완료
- **완료 기준:** `BlogHomeData.sections`가 카테고리와 공개 최신 글 최대 3개를 DB 정렬 순서로 제공한다. 빈 카테고리를 제외하고 mock/API/Supabase 의미가 일치하며, 서버 cache와 hard invalidation에 연결된다. 전체 목록을 브라우저로 내려 section을 만들지 않는다.
- **증거:** `BlogHomeData.sections`와 `getBlogCategories()`를 추가하고 Supabase shell cache에서 공개 글이 있는 카테고리마다 날짜 내림차순·slug 동률 순으로 최대 3개만 조회한다. 수동 pin이 없으면 section별 첫 글을 대표 후보로 재사용하며 mock/API 호환 경로도 같은 최신순 section을 만든다. 대상 5개 파일의 테스트 16개, typecheck, 대상 ESLint, `git diff --check`를 통과했다. 격리 Supabase fixture의 API에서 DB 정렬 순서 `ai/backend/frontend/design` section이 각 3개, pin 대표 2개, archive 총 56개, 공개 글 0개 카테고리 제외를 확인했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### SHELL — 공통 sidebar/content 반응형 shell

- **상태:** 완료
- **완료 기준:** 홈과 상세가 최대 약 1200px shell, 216–224px sticky sidebar, 32–40px gap과 같은 콘텐츠 시작선을 공유한다. tablet collapse와 모바일 Base UI 메뉴·검색이 keyboard/focus를 포함해 동작한다.
- **증거:** 홈과 상세에 공통 sidebar/content shell을 연결하고 desktop 1280/1440px와 mobile 390px에서 overflow 0, page error 0을 확인했다. tablet collapse와 모바일 메뉴·검색의 최종 회귀 검토까지 부모가 승인했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### HOME — 추천·최근·카테고리별 홈

- **상태:** 완료
- **완료 기준:** 기본 홈에 추천 carousel 6:4 구성과 같은 영역의 최근 글 3개 한 행, divider 아래 카테고리 정렬 순서별 최신 3개와 모두 보기가 구현된다. 불필요한 대형 최근 글 제목·설명을 추가하지 않는다. archive 진입 조건과 대표 규칙, 빈 카테고리 숨김, 검색 focus·URL·뒤로가기·초기 중복 fetch 0이 유지된다.
- **증거:** 실제 multi-category·cover fixture에서 추천 carousel, 같은 영역의 최근 글 3개, divider 아래 DB 순서별 section과 모두 보기 archive를 확인했다. 검색·category·tag·pagination, URL과 뒤로가기, 초기 중복 fetch 0과 focus 유지 회귀를 부모가 승인했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### DETAIL — 공통 shell 기반 상세

- **상태:** 완료
- **완료 기준:** cover 선행 정보 순서, no-cover 무공간 처리, 640~700px 본문, 작은 share rail과 TOC를 구현한다. 모바일 TOC, slug, metadata, private preview와 cache 동작이 유지된다.
- **증거:** 공통 shell 안에서 cover 우선 정보 순서, no-cover 무공간 처리, 좁은 본문과 share rail·TOC를 구현했다. desktop 1280/1440px와 mobile 390px의 공개 글·no-cover 글·반응형 동작을 확인했다. private preview와 CMS 보안은 이전 체크포인트에서 실제 검증했고, 이번 변경에서는 해당 코드와 cache 경계가 보존됐음을 검토했다(2026-09-10, 부모 승인).
- **보류 사유/재개 조건:** 해당 없음.

### VISUAL — 참조 비교와 교정

- **상태:** 완료
- **완료 기준:** 1280px와 1440px 데스크톱, 390px 모바일에서 실제 구현 캡처와 저장된 홈·상세 참조를 나란히 놓고 정보 구조, 폭, 시작선, 밀도와 위계를 비교한다. 테스트 숫자 통과만으로 완료하지 않는다. 외부 브랜드 요소를 복제하지 않고 Day0 토큰 범위에서 사용자 반려 지점을 교정한다.
- **증거:** 저장된 참조와 실제 홈·상세·no-cover 화면 9개를 1280px, 1440px, 390px에서 나란히 비교했다. 모든 화면에서 overflow와 browser error가 0건이었고 콘텐츠 시작점은 1280px에서 x=296, 1440px에서 x=376, 모바일에서 x=16으로 일치했다. 상세 본문은 desktop 700px, mobile 358px이며 모바일 share, TOC, sticky 동작까지 확인했다. 외부 광고·로고·채팅 위젯은 복제하지 않았다(2026-09-10, 부모 승인).
- **보류 사유/재개 조건:** 해당 없음.

### QA — 실제 데이터 회귀와 전체 검사

- **상태:** 완료
- **완료 기준:** mock 2개만으로 완료 판정하지 않는다. 실제 multi-category와 cover가 있는 격리 fixture에서 수동 pin 및 무핀 fallback, 카테고리 section, 모두 보기, 검색·태그·페이지, empty/error, 초기 중복 fetch, focus·keyboard·back navigation을 검증한다. 기존 unit/integration suite와 `pnpm typecheck`, `pnpm lint`, `pnpm check:css`, `pnpm check:design`, `pnpm build`, `git diff --check`를 통과한다.
- **증거:** 격리 DB의 공개 글 56개·4개 주제·수동 pin 2개에서 section당 최신 글 3개와 빈 카테고리 제외를 확인하고, pin을 모두 해제한 뒤 각 주제 최신 글 1개씩 4개 대표가 정렬 규칙과 일치함을 확인했다. 실제 desktop/mobile에서 연속 검색 focus, `view=all` 2→1페이지 이동, 카테고리 이동의 단일 API·RSC 0건, browser back URL 복원, carousel Enter, 모바일 메뉴 닫힘, clipboard 복사, TOC anchor·sticky를 통과했으며 최초 SSR의 중복 API도 0건이었다. 전체 64개 파일의 테스트 302개는 최종 공유 교정 전에 통과했고, 교정 후 관련 테스트 12개와 typecheck·CSS 검사를 다시 통과했다. lint는 오류 0·기존 경고 4건, CSS 검사 57개, design 검사 19개, 최종 build와 `git diff --check`가 성공했다. production 서버에서 홈·상세·OG가 200이고 mobile share가 보이며 browser error가 0건임을 확인했다. private preview와 CMS 저장 보안은 이전 체크포인트의 실제 검증을 근거로 삼고 이번에는 경계 보존을 검토했다(2026-09-10, 부모 승인).
- **보류 사유/재개 조건:** 해당 없음.

### COMMIT — 레이아웃 교정 로컬 체크포인트

- **상태:** 완료
- **완료 기준:** 이번 레이아웃 교정과 QA 결과를 별도 로컬 commit으로 보존한다.
- **증거:** 사용자가 현재 작업트리의 커밋을 명시적으로 승인했다. 이 문서 변경을 포함한 로컬 체크포인트 커밋으로 보존한다.
- **보류 사유/재개 조건:** 해당 없음.

### RELEASE — push·deploy

- **상태:** 보류
- **완료 기준:** push나 deploy는 각각 명시적 승인 뒤 실행하고 대상 revision과 health를 확인한다.
- **증거:** 로컬 커밋 승인에는 push·deploy 승인이 포함되지 않는다.
- **보류 사유/재개 조건:** 사용자가 push 또는 deploy를 명시적으로 지시하면 해당 범위만 재개한다.

## 상태 갱신 규칙

작업을 시작할 때 해당 항목을 `진행중`으로 바꾸고, 완료 기준과 증거를 채운 뒤에만 `완료`로 바꾼다. 단순히 시작하지 않은 작업은 `미완료`다. 외부 결정이나 명시적 승인을 기다릴 때만 `보류`를 쓰고 재개 조건을 함께 적는다. 선행 작업이나 상태가 달라지면 상태판과 작업 항목을 같은 변경에서 갱신한다.
