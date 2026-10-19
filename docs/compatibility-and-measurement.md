# 호환성과 검증 범위

이번 개선은 기존 URL, API 응답, 저장 데이터 구조를 유지한다. UI 조작과 화면 상태를 개선하기 위해 DB migration이나 새 공개 analytics endpoint를 추가하지 않는다.

| 계약          | 보존 기준                                                        | 검사 위치                                                   |
| ------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| 글 URL        | 기존 slug 경로에서 canonical 주제/글 경로로 이동, 한글 slug 처리 | `src/constants/routes.ts`, 공개 글 route와 posts API tests  |
| 필터와 페이지 | URL query, 새 탭/뒤로가기, 한글 조합과 검색 취소 유지            | BlogHomeContainer·CommandPalette tests                      |
| RSS           | XML escaping, published만 포함, 기존 feed URL 유지               | `src/app/rss.xml/__tests__/route.test.ts`                   |
| 공개 API      | 기존 응답·페이지 범위·draft 배제·실패 표현 유지                  | `src/app/api/posts/**/__tests__`, posts.api tests           |
| 관리자 API    | 인증·인가와 request validation, PUT idempotency 유지             | admin posts/preview/uploads/comments route tests            |
| Markdown      | 코드·표·SVG 정제·한글 내용 보존 (미배포 embed 제외)              | markdown render, MarkdownWidgets, ContentEnhancements tests |
| 공유          | 기존 URL 생성과 native share/copy 실패 복구                      | ShareButtons·share-url tests                                |
| 편집          | 기존 입력·session 임시본 유지, 경합 시 덮어쓰기 거부             | PostEditor·posts.actions tests                              |
| 배포          | dev/production origin·storage 분리, revision 증거와 복구 결과    | deployment harness, public readiness smoke                  |

API 문서는 `src/lib/api/openapi.ts`의 요청·응답 예와 인증 조건을 유지한다. `/api/docs`는 production 전용이며 Google owner session으로 대체되지 않는 별도 Access JWT·audience·허용 identity 경계다. HTML/JSON 모두 private·no-store이고 일반 내비게이션에 노출하지 않는다. 일반 오류 envelope와 기존 endpoint의 legacy 오류 형식은 구분되어 있으며 UI 개선을 이유로 응답 형식을 통일하지 않는다. 실제 JWT 서명·claim 검증은 로컬 key를 사용하는 `src/app/api/docs/__tests__/route.test.ts`로 확인했다. 운영 Cloudflare Access 정책과 허용 계정 로그인은 별도 외부 검증 대상이다.

## 성능과 네트워크 측정

현재 서버 공개 cache 60초, 브라우저 stale 시간, request abort/debounce, 목록의 열 선택·range를 보존한다. 이미지 변형이나 cache TTL 변경은 측정 근거 없이 도입하지 않는다. HTML/JS 크기·요청 횟수는 측정한 revision, origin, viewport, cache 상태와 함께 기록한다.

배포 후보 브라우저 검증에서는 첫 hydration의 `/api/posts` 중복 요청, 빠른 검색 후 이전 응답의 무시/취소, 필터 변경의 요청 수, 이미지 전송 bytes를 확인한다. 실제 production과 mock runtime 결과를 구분한다. 개발 모드의 LCP나 한 번의 lab 실행을 실제 사용자의 INP·전환율 개선이라고 표현하지 않는다. 필드 성능/비용/트래픽 지표는 이번 작업에서 실측하지 않았다.

2026-10-19 격리된 mock/webpack 개발 화면(1440px, reduced motion)에서 첫 hydration의 `/api/posts` 요청은 0회였다. `r`→`ra`→`raven`을 80ms 간격으로 입력하면 최종 `q=raven&page=1&pageSize=6` 요청만 1회 발생했다. 첫 요청에 합성 지연을 주고 다음 검색을 입력한 경우 이전 요청은 `net::ERR_ABORTED`로 취소되고 입력은 최신 값으로 유지됐다. 해당 개발 화면의 완료 요청은 21개, 응답 body 합계는 9,499,087 bytes였으며 이미지 요청은 없었다. 이 크기에는 개발 runtime이 포함되므로 production 번들·실제 이미지 전송량의 근거로 사용하지 않는다.

## Analytics 수집 범위

`src/lib/analytics/events.ts`의 허용 이벤트는 아래뿐이다. 함수는 원문 검색어, 댓글, URL, 제목, 닉네임, 이메일을 받지 않는다.

| 이벤트                 | 허용 값                       | 답하는 질문                        |
| ---------------------- | ----------------------------- | ---------------------------------- |
| `search_open`          | `header`, `shortcut`          | 검색을 여는 진입점은 무엇인가      |
| `search_result_open`   | `palette`, `archive`          | 검색 결과에서 글로 이동하는가      |
| `article_share`        | `copy`, `native_share`        | 어떤 공유 수단이 성공했는가        |
| `related_article_open` | `related`, `previous`, `next` | 다음 글로 이동하는 경로는 무엇인가 |

기존 Google SDK의 자동 pageview 방식은 유지한다. 초기 query/hash, admin/auth/API 및 허용되지 않은 경로에서는 SDK를 로드하지 않는다. 이미 로드된 문서가 이 경계에 진입하거나 외부 링크/다운로드/폼 입력을 사용하면 그 문서의 수집을 차단하고 full navigation 전까지 다시 켜지 않는다. SDK 로드 전 커스텀 이벤트는 보관하지 않는다. 따라서 검색·UTM·필터·목차 hash와 이후 SPA 활동 일부가 통계에서 빠질 수 있다. 배포일과 이 제외 범위를 통계 해석에 반영한다.

외부 GA enhanced measurement 설정은 저장소의 이벤트 사전과 별개다. 실제 설정·보존기간·동의 필요는 이번 코드에서 확인할 수 없다. `scripts/check-analytics-privacy.mjs`는 public tag를 실제 브라우저에서 실행하되 collect 요청을 전송 전에 차단하여 합성 sentinel 누출과 정상 pageview 생성을 확인한다. 이 검사는 GA 보고서 반영 성공이나 모든 미래 vendor 설정의 안전성을 증명하지 않는다. 외부 설정 변경 뒤 재실행한다.

### 코드 후보의 SDK 검증 기록

2026-10-19 실제 공개 Google tag를 합성 `raven.kr` 문서에서 실행해 15개 시나리오를 검사했다. 수집 요청은 네트워크 전송 전에 가로채 abort 또는 로컬 204 응답으로 처리했다. 정상 최초 pageview 1회, 정상 SPA 이동의 추가 pageview 1회, 민감 초기 URL의 SDK 요청 0회, 검색/주소 hash/인증/관리자/외부 링크/메일/다운로드/폼/referrer/SDK 로딩 경합의 sentinel 누출 0회를 확인했다. abort 모드에서는 같은 measurement ID·event sequence의 대체 주소 재시도가 생겼고 로컬 204 모드에서는 최초 pageview 요청이 1회였다.

차단 전에 준비된 안전한 scroll 이벤트가 이후에 전달 시도되는 경우는 있었다. 따라서 모든 후속 요청이 0이라고 주장하지 않으며 민감 값·관리자 주소가 포함되지 않는지를 기준으로 삼는다. 이 검증은 저장소 controller를 실제 SDK와 실행한 결과이며 배포 완료, GA 보고서 반영, GA console 권한·설정 조회를 뜻하지 않는다. 브라우저 수집의 외부 HTTP Referer는 검사한 Chrome에서 `https://raven.kr/` origin만 포함했고, 문서 전체의 referrer policy는 바꾸지 않았다.

근거: [Google 수집 비활성화 제어](https://developers.google.com/tag-platform/security/guides/privacy), [GA config](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [자동 수집 항목](https://support.google.com/analytics/answer/9216061?hl=en), [data redaction 한계](https://support.google.com/analytics/answer/13544947?hl=en).
