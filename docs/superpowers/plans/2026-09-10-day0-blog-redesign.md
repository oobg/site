# Day0 블로그 전면 개편 계획과 상태

> 작성일: 2026-09-10
> 상태 SSOT: 이 문서의 상태판과 작업 항목. 상태는 `미완료`·`진행중`·`보류`·`완료`만 쓴다.
> 후속 작업: 기능·검증 이력은 이 문서에 보존하고, 사용자 시각 반려 이후의 레이아웃 교정은 [Channel 블로그 레이아웃 교정 계획](2026-09-10-channel-blog-layout-revision.md)에서 추적한다.

## 목표와 확정 범위

공개 사이트와 관리자 전체를 Day0 라이트 언어로 통일하고, 홈(`/`)을 블로그의 첫 화면으로 바꾼다. Pretendard Variable, `#3d7de5`에서 파생한 `--d0-*` 토큰, CSS Modules, plain/borderless 기본, `data-*` 상태, 접근 가능한 포커스와 reduced motion을 적용한다. sticky 헤더와 blur 동작은 유지한다.

- 홈: 대표 글(데스크톱 이미지 왼쪽/텍스트 오른쪽, 모바일 이미지→제목→조작부), 수동 캐러셀, 카테고리 탭, 최신 글 3열 plain grid, 검색과 페이지네이션. 모바일은 단일 열이다.
- 상세: 약 700px 본문, 우측 TOC(모바일 접기), 제목·요약·작성자·날짜·읽기 시간·cover, 하단 태그·공유·작성자·관련 글.
- CMS: 카테고리 CRUD, 글당 대표 카테고리 1개와 자유 태그 여러 개, cover 업로드 미리보기와 crop position, 공개 글 pin/unpin/reorder와 draft preview.
- 라우팅: `/blog`는 `/`로 연결하고 기존 `/blog/[slug]` URL, canonical, sitemap을 보존한다. About과 Projects는 별도 메뉴로 유지하며 같은 시각 언어를 적용한다.
- 참조: [Channel Tech 홈](https://tech.channel.io/kr)과 [브랜드 디자인 글](https://tech.channel.io/kr/articles/branddesign-4831fd41)의 정보 구조를 참고한다. 2026-09-10 현재 데스크톱·모바일 홈과 글 화면 캡처 4장을 확인했으며, 구현은 합의한 수동 캐러셀과 카테고리 탭 구성을 우선한다.

대표 글 규칙은 다음으로 확정한다. 공개 고정 글이 있으면 고정 순서만 최대 5개 노출하고 자동 선정과 섞지 않으며, 관리자는 여섯 번째 고정을 거절하고 이유를 안내한다. 고정 글이 없으면 카테고리별 최신 글 1개를 뽑은 뒤 `published_at` 내림차순, 동률이면 slug 오름차순으로 상위 5개를 고른다. 1개면 조작부를 숨기고 자동 재생은 하지 않는다. 빈 카테고리는 숨기며 전체 공개 글이 0개면 empty state를 보인다. pin 순서 동률도 안정적인 보조 키로 결정한다. 아래 최신 목록은 전체 공개 글의 canonical archive이며 대표 글도 누락시키지 않는다.

## 착수 시 근거와 구현 제약

- Next.js 16, React 19, pnpm, Supabase/Postgres/Auth, Cloudflare R2를 사용한다. mock과 기존 API 호환 경로도 있다.
- 착수 당시 DB migration의 `posts`에는 태그, 카테고리, cover, crop, pin 필드가 없었고 Supabase 공개 매퍼가 `tags: []`, `cover_image_url: null`을 임시로 만들었다. 이를 기준으로 기존 글을 `미분류`로 안전하게 이동하는 가역 migration을 먼저 검증했다.
- 착수 당시 `@base-ui/react`는 설치됐지만 사용처가 없었다. 접근성과 동작 primitive로 실제 활용하고 CSS Modules로 Day0 모양을 입혔다. 저장소의 barrel 금지 규칙 때문에 Day0 monorepo용 `index.ts` 등록 규칙은 적용하지 않는다.
- 착수 당시 TanStack Query는 provider/options만 있고 소비자가 없었다. 클라이언트 공개 조회는 server-only Supabase 모듈을 직접 import하지 않고 공개 Route Handler를 지나며, 요청별 QueryClient의 prefetch/hydrate로 첫 client fetch와 필터·검색·페이지 전환의 중복 요청을 줄였다.
- React `cache()`는 같은 서버 렌더 안의 중복 제거일 뿐 장기 캐시나 방문자 간 캐시가 아니다. 브라우저 Query cache, Next 서버 데이터 cache, Supabase 조회의 경계와 공개/비공개 정책을 각각 명시한다. 개인별·비공개 응답은 공유 cache에 넣지 않는다.
- `docs/api-contract/content-v2.md`는 현재 사용하지 않는 외부 API 계약 보관본이다. 현재 Supabase 계약과 섞거나 덮어쓰지 않는다. 기존 다크 `docs/references/design-language.md`는 구현 전 정본이며, 전환이 끝난 뒤 검사와 함께 새 SSOT로 동기화한다.
- 과거 회고의 102px 대형 히어로와 반복 카드 셸 실패를 되풀이하지 않는다. 블로그 정보 밀도와 plain 행/grid를 우선한다.
- 이 판단의 ontology 근거는 personal 영역 `raven.kr`의 「raven.kr 랜딩 재설계 — 세 번의 실패와 day0 이식 (2026-08-10)」이다.

## 상태판

| ID      | 작업                             | 상태 | 선행 작업                  |
| ------- | -------------------------------- | ---- | -------------------------- |
| DOC     | 계획·상태 SSOT 작성              | 완료 | 없음                       |
| DATA    | 데이터 모델·migration·선정 규칙  | 완료 | DOC                        |
| QUERY   | 공개 조회·캐시·mutation 무효화   | 완료 | DATA                       |
| UI      | Base UI primitive·Day0 토큰 기반 | 완료 | DOC                        |
| HOME    | 홈 블로그·검색·필터·페이지네이션 | 완료 | DATA, QUERY, UI            |
| DETAIL  | 글 상세 읽기 경험                | 완료 | DATA, QUERY, UI            |
| ADMIN   | 관리자 콘텐츠 운영 기능          | 완료 | DATA, QUERY, UI            |
| PAGES   | 헤더·About·Projects·라우팅 통합  | 완료 | UI, HOME                   |
| QA      | 테스트·문서·최종 검토            | 완료 | HOME, DETAIL, ADMIN, PAGES |
| RELEASE | 커밋·배포(후속 범위)             | 보류 | QA, 사용자 승인            |

## 작업 항목

### DOC — 계획·상태 SSOT 작성

- **상태:** 완료
- **완료 기준:** 합의 범위, 현재 코드 근거, 의존 순서, 각 상태와 완료 기준이 이 문서에 있고 README에서 찾을 수 있다. 부모 검토에서 누락·과도한 추측이 없음을 확인한다.
- **증거:** 부모 검토 완료, README 계획 링크 추가, `git diff --check` 통과(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### DATA — 데이터 모델·migration·선정 규칙

- **상태:** 완료
- **완료 기준:** categories CRUD용 테이블/정렬, post의 대표 category 1개·자유 tags·cover key/URL·crop position, 공개 글 pin 순서가 타입과 가역 migration에 반영된다. 기존 글은 데이터 손실 없이 `미분류`로 이동하고 카테고리를 삭제해도 글은 삭제하지 않고 `미분류`로 옮긴다. 공개 전용 pin 제약, 고정 최대 5개, 자동 선정 순서, 동률 보조 키, 빈 상태를 단위 테스트한다. live DB에는 자동 적용하지 않는다.
- **증거:** 신규 migration과 로컬 rollback SQL, 공개 블로그 타입·검증 schema·선정/필터/페이지 유틸. Vitest 대상 9개 및 전체 257개 통과, 대상 ESLint·typecheck·`git diff --check` 통과. 격리 Supabase Postgres 17 컨테이너에서 기존 migration과 기존 글 2건을 넣은 뒤 신규 migration·SQL invariant·rollback을 실행했다. 기존 글 2건의 category/timestamp 보존, 기본 카테고리 보호와 삭제 이동, 최대 5개 pin과 draft 전환 해제, 소유자 권한 및 anon/authenticated RLS를 검증했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### QUERY — 공개 조회·캐시·mutation 무효화

- **상태:** 완료
- **완료 기준:** 구현 조사로 `staleTime`과 Next `revalidate` 값을 정하고 근거를 기록한다. 공개 Route Handler, request-scoped QueryClient prefetch/dehydrate/hydration, 실제 `useQuery` 소비를 연결해 초기 중복 fetch를 막는다. publish/edit/unpublish/category/pin/reorder 뒤 서버 cache와 관리자 현재 QueryClient의 관련 key를 무효화한다. 다른 방문자의 이미 열린 브라우저 cache는 즉시 push 갱신 대상으로 보지 않고 stale/refetch와 서버 revalidate 경계를 문서화한다. draft preview와 관리자 데이터는 공유 cache에서 제외하며, 비공개 전환 뒤 신규 공개 요청에 draft가 노출되지 않음을 검증한다.
- **증거:** 현재 공개 `/api/posts`와 browser `useQuery`, request scoped SSR prefetch/dehydrate, Supabase range/count·bounded featured/category 조회, 60초 서버 cache와 hard invalidation helper를 구현했다. HTTP 응답은 `no-store`, 공개 서버 데이터만 방문자 간 60초 재사용, React Query는 stale 60초/gc 5분이며 첫 hydrate 소비가 재요청하지 않음을 검증했다. 관리자·draft 데이터는 공유 cache에 넣지 않고, 다른 방문자의 열린 browser cache는 push하지 않으며 stale/refetch로 갱신한다. 격리 Supabase REST의 공개 25건·draft 2건 fixture에서 category count가 공개 글만 13/12건으로 집계되고, inner category filter가 13건 전체에 정확히 적용됐으며 owner RPC의 5개 pin 저장이 성공했다. 실제 browser에서 첫 mount/RSC 중복 요청 0건, 필터 요청 1건을 확인하고, 공개 글을 draft로 바꾼 직후 상세 API 404·목록 제외·owner preview 유지를 확인했다. PostgREST의 두 단계 literal escape를 실제 API로 확인해 `_`, `%`, `\` 검색이 각각 정확한 `qa-literal` 1건만 반환했다. 전체 테스트 299개와 QUERY 대상 테스트·typecheck·ESLint를 통과했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### UI — Base UI primitive·Day0 토큰 기반

- **상태:** 완료
- **완료 기준:** 기존 토큰을 `--d0-*` 라이트 팔레트와 Pretendard Variable로 전환하고 design check를 갱신한다. Tabs, Select/Menu, Dialog, 입력·버튼 등 적합한 곳에 Base UI의 접근성/keyboard behavior를 실제 사용한다. plain 기본, 14/10/8 radius, `data-*`, focus-visible, reduced motion을 검증하며 sticky+blur 헤더 동작을 보존한다.
- **증거:** Day0 token과 Button·Input·Select·Dialog·CategoryTabs primitive 구현. primitive 관련 테스트 4개, checker SSOT negative test, `pnpm check:design`, `pnpm check:css` 및 부모 검사를 통과했다(2026-09-10).
- **보류 사유/재개 조건:** 해당 없음.

### HOME — 홈 블로그·검색·필터·페이지네이션

- **상태:** 완료
- **완료 기준:** 확정한 대표 선정 규칙과 반응형 캐러셀, 카테고리 탭, 검색, 최신순 3열/단일열 archive, 페이지네이션, cover fallback, 0건 empty state가 구현된다. 검색·카테고리·페이지는 URL로 공유되고 뒤로가기를 복원하며, 검색이나 카테고리가 바뀌면 1페이지로 이동한다. 기존 `/blog?tag=...`는 `/?tag=...`로 자유 태그 필터 의미를 보존하며 카테고리로 임의 변환하지 않는다. 대표 영역 때문에 최신 목록의 글이 빠지지 않는다.
- **증거:** 대표 carousel, category tabs, 검색, 최신 archive와 pagination, cover fallback과 empty state를 구현했다. 1440/390 실제 browser에서 반응형·overflow·keyboard 조작과 URL/뒤로가기 복원을 확인했다. 첫 화면 공개 API 0건, 검색 전환 API 1건, RSC 중복 0건이었으며 디바운스 후 input DOM과 focus 유지, 연속 입력, browser URL 동기화를 테스트 9개로 검증했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### DETAIL — 글 상세 읽기 경험

- **상태:** 완료
- **완료 기준:** 약 700px 중앙 본문, 우측 TOC와 모바일 접기, 전체 header 메타·cover, 하단 태그·공유·작성자·관련 글을 구현한다. cover 없는 글은 fallback을 보인다. `mdast`/`hast` 타입의 실제 사용처를 확인하고 typecheck 후 불필요할 때만 제거한다.
- **증거:** 실제 Chrome 1440px에서 약 700px 본문과 1102px 지점의 우측 TOC, 390px에서 약 342px 본문·모바일 TOC·overflow 없음·page error 0을 확인했다. 제목→cover→모바일 TOC→본문→태그 링크 순서와 관련 글, cover fallback을 검증하고 관련 테스트와 typecheck를 통과했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### ADMIN — 관리자 콘텐츠 운영 기능

- **상태:** 완료
- **완료 기준:** category CRUD와 정렬, 대표 category·tags 편집, R2 cover 업로드 미리보기·crop position, public-only pin/unpin/reorder, draft preview가 저장부터 공개 반영까지 동작한다. 실패·빈 상태와 keyboard 조작도 제공한다.
- **증거:** category CRUD·기본 보호·삭제 이동, 대표 category와 소문자 unique tags, cover upload 미리보기·key/URL·crop·alt, 공개 글 최대 5개 pin RPC, owner 전용 draft preview를 구현했다. post/category/pin mutation은 서버 hard invalidation과 현재 QueryClient invalidation을 함께 수행한다. 격리 Supabase와 owner session의 실제 browser에서 cover upload 201, Markdown preview, 공개 글 생성과 상세 200, tags `React, react, QA`의 `react, qa` 저장, category·crop·alt·cover URL 저장을 확인했다. category CRUD, 5개 pin 재정렬, 전체 unpin 뒤 3개 category 자동 대표 복원, 공개→draft 뒤 공개 API 404·목록 제외와 owner preview 유지를 확인했다. 관리자 탭 workspace와 편집기 레이아웃을 적용했으며 전체 299개 테스트, 대상 테스트·typecheck·ESLint·design/css check를 통과했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### PAGES — 헤더·About·Projects·라우팅 통합

- **상태:** 완료
- **완료 기준:** `/blog`가 `/`로 연결되고 `/blog/[slug]`는 유지된다. sticky/blur 헤더에서 홈·About·Projects·관리자 동선이 명확하며 About/Projects/상태 화면도 Day0 톤으로 맞는다. 기존 dark 문서와 design check를 새 구현에 동기화한다.
- **증거:** 소개·프로젝트 페이지 톤 정리 및 관련 테스트 11개 통과. About·Projects·404의 1440/390 화면에서 overflow와 console 오류가 없음을 확인했다. canonical·sitemap·robots·themeColor, sticky blur header와 모바일 Dialog를 검증했고 실제 1200×630 OG PNG에서 한국어 glyph가 정상 렌더링됐다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### QA — 테스트·문서·최종 검토

- **상태:** 완료
- **완료 기준:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:css`, `pnpm check:design`, `pnpm build`가 통과한다. 실제 대표 viewport에서 접근성·responsive·empty/error/loading·cache 동작을 검토한다. canonical/sitemap, 라이트 `themeColor`, OG, favicon/icon을 확인하고 README/CMS 문서와 이 상태판의 증거를 갱신한다.
- **증거:** 전체 65개 파일의 테스트 300개, `pnpm typecheck`, `pnpm lint`(오류 0, 기존 config 2건과 image 2건 경고), `pnpm check:css`(56개), `pnpm check:design`, `pnpm build`가 통과했다. 임시 production build 서버에서 `/`, 1200×630 OG PNG, icon, sitemap 200 응답을 확인하고 1440/390 viewport의 접근성·responsive·empty/error/loading·cache 동작을 검토했다. 격리 Supabase DB와 owner session에서 migration·category·pin·upload·preview·cache·literal 검색을 검증했으며 live DB에는 migration이나 데이터를 적용하지 않았다. 직접 사용하지 않는 `@types/mdast` 의존성을 제거했고 필요한 transitive dependency는 유지된다. README, CMS 안내, 디자인 SSOT와 상태판을 동기화했다(2026-09-10, 부모 검토 완료).
- **보류 사유/재개 조건:** 해당 없음.

### RELEASE — 커밋·배포(후속 범위)

- **상태:** 보류
- **완료 기준:** 현재 구현 Goal의 완료 조건에서 제외한다. 후속 승인을 받으면 승인된 범위로 커밋하고 지정 환경의 정확한 revision과 상태를 검증한다.
- **증거:** commit SHA와 배포 revision/health.
- **보류 사유/재개 조건:** 이번 요청에는 커밋·배포 승인이 없다. QA 완료 후 사용자가 명시적으로 승인하면 재개한다.

## 상태 갱신 규칙

작업을 시작할 때 해당 항목을 `진행중`으로 바꾸고, 완료 기준과 증거가 모두 채워진 뒤에만 `완료`로 바꾼다. 외부 결정이나 권한 때문에 멈출 때만 `보류`로 두고 사유와 재개 조건을 쓴다. 단순히 아직 시작하지 않은 일은 `미완료`다. 선행 작업이 바뀌면 상태판과 해당 항목을 같은 변경에서 갱신한다.
