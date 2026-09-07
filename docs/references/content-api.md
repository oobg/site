# 콘텐츠 읽기 컨벤션

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §8.
> 운영 구조는 Next.js 단일 앱과 Supabase 직접 조회다. [`docs/api-contract/content-v2.md`](../api-contract/content-v2.md)는 기존 API 호환 모드의 보관 계약이다.

## server-read-first

- 읽기 전용 정적 콘텐츠는 **RSC 서버에서 직접 fetch** — 클라이언트 재요청 없음.
- `features/posts/services/posts.api.ts`, `features/projects/services/projects.api.ts`의 함수를 서버 컴포넌트에서 직접 호출.
- 두 파일 모두 `import 'server-only'` 선언 — 클라이언트 번들 불가.

## 콘텐츠 소스 어댑터

- `CONTENT_SOURCE` 환경변수로 분기:
  - `mock` (기본): 각 피처 `fixtures/*.mock.ts` 사용.
  - `supabase` (운영): posts는 Supabase Postgres에서 직접 읽고 projects는 mock을 유지.
  - `api` (기존 호환): `lib/api/http.ts` fetch 래퍼로 외부 콘텐츠 API 호출.
- 별도 콘텐츠 백엔드는 운영 구성에 포함하지 않는다.

## 환경변수

| 변수                | 기본값                 | 설명                                          |
| ------------------- | ---------------------- | --------------------------------------------- |
| `CONTENT_API_BASE`  | `https://api.raven.kr` | 기존 `api` 모드 전용                          |
| `CONTENT_SOURCE`    | `mock`                 | `mock`, `api`, `supabase`                     |
| `REVALIDATE_SECRET` | —                      | revalidation 웹훅 시크릿                      |
| `R2_PUBLIC_URL`     | —                      | Markdown의 `/assets/...`를 연결할 공개 origin |

`supabase` 공개 조회는 RLS와 별도로 목록·상세 쿼리에 `status = 'published'`를 넣는다. 현재 posts 테이블에는 tags와 cover 컬럼이 없으므로 기존 계약에는 `tags: []`, `cover_image_url: null`, `description → summary`, `body → body_markdown`으로 맞춘다.

Markdown의 `/assets/...` `src`·`href`는 렌더 단계에서 `${R2_PUBLIC_URL}/assets/...`로 바꾼다. 외부 URL과 다른 root-relative 경로는 그대로 둔다. 경로 탈출 형태는 변환하지 않는다.

## 캐시 태그 스킴

| 태그             | 대상          |
| ---------------- | ------------- |
| `posts`          | 글 목록       |
| `post:<slug>`    | 글 상세       |
| `projects`       | 프로젝트 목록 |
| `project:<slug>` | 프로젝트 상세 |

- fetch 래퍼(`lib/api/http.ts`)에서 `next: { tags, revalidate }` 설정.
- 기본 revalidate: 3600s.

## 기존 API 호환 revalidate 웹훅 (`POST /api/revalidate`)

```
POST /api/revalidate
X-Revalidate-Secret: <REVALIDATE_SECRET>
{ "changed": [{ "type": "post"|"project", "slug": "..." }] }
```

- 시크릿 불일치 → 401.
- 각 항목 `revalidateTag('post:'+slug)` 등 + 목록 태그 무효화.
- 200 `{ revalidated: true, count }`. `changed`가 비면 목록 태그만.

## 기존 API 호환 계약 타입 (`lib/api/contract.types.ts`)

`content-v2.md` 스키마를 TypeScript로 미러링. 직접 수정 금지 — 계약 변경 시 `content-v2.md` 먼저 수정 후 여기 반영.

> **slug 규칙**: 유니코드(한글) slug 허용 + NFC 정규화 필수. 상세는 `content-v2.md` 참조.

```ts
Envelope<T>; // { data: T; meta: { requestId, serverTime, pagination? } }
Pagination; // { total, page, limit }
ContentListItem; // slug, title, summary, tags, published_at, updated_at, cover_image_url, reading_time_min?, status
ContentDetail; // ContentListItem + body_markdown, frontmatter
ListParams; // tag?, page?, limit?, sort?
```

피처별 frontmatter 헬퍼:

- `PostFrontmatter`: `{ date?, cover? }`
- `ProjectFrontmatter`: `{ role?, period?, stack?[], links?{ repo?, live? } }`

## queryOptions (`*.query.ts`)

`postsQueryOptions` 등은 **정의만** 두고 실제 사용은 상호작용 페이지 등장 시. `*.api.ts`는 `server-only`라 queryFn에서 직접 호출 불가 — 필요 시 Route Handler 프록시 또는 공개 API 직접 호출.
