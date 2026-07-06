# 콘텐츠 API 소비 컨벤션

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §8.
> API 계약 SSOT: [`docs/api-contract/content-v1.md`](../api-contract/content-v1.md) (원본은 api repo).

## server-read-first

- 읽기 전용 정적 콘텐츠는 **RSC 서버에서 직접 fetch** — 클라이언트 재요청 없음.
- `features/posts/services/posts.api.ts`, `features/projects/services/projects.api.ts`의 함수를 서버 컴포넌트에서 직접 호출.
- 두 파일 모두 `import 'server-only'` 선언 — 클라이언트 번들 불가.

## mock ↔ api 어댑터

- `CONTENT_SOURCE` 환경변수로 분기:
  - `mock` (기본): 각 피처 `fixtures/*.mock.ts` 사용.
  - `api`: `lib/api/http.ts` fetch 래퍼로 실 API 호출.
- 백엔드 준비 후 env만 바꾸면 된다 — 소비 코드 수정 불필요.

## 환경변수

| 변수                | 기본값                 | 설명                     |
| ------------------- | ---------------------- | ------------------------ |
| `CONTENT_API_BASE`  | `https://api.raven.kr` | 실 API 베이스 URL        |
| `CONTENT_SOURCE`    | `mock`                 | `mock` 또는 `api`        |
| `REVALIDATE_SECRET` | —                      | revalidation 웹훅 시크릿 |

## 캐시 태그 스킴

| 태그             | 대상          |
| ---------------- | ------------- |
| `posts`          | 글 목록       |
| `post:<slug>`    | 글 상세       |
| `projects`       | 프로젝트 목록 |
| `project:<slug>` | 프로젝트 상세 |

- fetch 래퍼(`lib/api/http.ts`)에서 `next: { tags, revalidate }` 설정.
- 기본 revalidate: 3600s.

## revalidate 웹훅 (`POST /api/revalidate`)

```
POST /api/revalidate
X-Revalidate-Secret: <REVALIDATE_SECRET>
{ "changed": [{ "type": "post"|"project", "slug": "..." }] }
```

- 시크릿 불일치 → 401.
- 각 항목 `revalidateTag('post:'+slug)` 등 + 목록 태그 무효화.
- 200 `{ revalidated: true, count }`. `changed`가 비면 목록 태그만.

## 공통 계약 타입 (`lib/api/contract.types.ts`)

`content-v1.md` 스키마를 TypeScript로 미러링. 직접 수정 금지 — 계약 변경 시 `content-v1.md` 먼저 수정 후 여기 반영.

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
