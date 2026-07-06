> 원본 SSOT: api repo의 docs/api-contract/content-v1.md. 이 파일은 참조 사본이다.

# 콘텐츠 API 계약 v1 (SSOT)

> 프론트(Next.js SSG+ISR)와 백엔드가 공유하는 단일 진실 원천.
> 상태: **합의됨, 미구현**. 이 문서가 스키마의 기준이고, 구현·프론트 타입은 여기에 맞춘다.
> 변경은 이 파일을 고치고 버전(v1→v2)을 올린다.

## 원칙

- **공개 읽기 전용.** 콘텐츠 `GET`은 `@Public`+`@SkipTenant`. JWT·`X-Tenant-Id` 불필요. Cloudflare Access bypass path.
- **본문은 raw 마크다운.** 서버는 렌더 안 함. TOC·하이라이팅은 프론트.
- **frontmatter는 파싱된 객체로 패스스루.** 하드 컬럼은 공통 필드만. 타입별 고유 필드는 `frontmatter{}`로 흡수 → 백엔드 제네릭 유지.
- **이미지는 항상 절대 URL.** MVP는 GitHub raw. 호스팅 스왑은 백엔드/오너 결정이며 프론트 무영향.
- **envelope 재사용.** 성공 `{data, meta}` / 에러 `{error, meta}`.
- **draft 기본 제외.** `status: published`만 공개 목록·상세에 노출.

## 엔드포인트

| 메서드 | 경로                      | 설명                      |
| ------ | ------------------------- | ------------------------- |
| GET    | `/content/posts`          | 글 목록 (요약)            |
| GET    | `/content/posts/:slug`    | 글 상세 (본문 포함)       |
| GET    | `/content/projects`       | 프로젝트 목록 (요약)      |
| GET    | `/content/projects/:slug` | 프로젝트 상세 (본문 포함) |

### 쿼리 파라미터 (목록 공통)

| 파라미터 | 타입      | 기본            | 비고                                                             |
| -------- | --------- | --------------- | ---------------------------------------------------------------- |
| `tag`    | string    | —               | 해당 태그를 가진 항목만                                          |
| `page`   | int ≥1    | `1`             |                                                                  |
| `limit`  | int 1~100 | `20`            |                                                                  |
| `sort`   | string    | `-published_at` | `-` 접두는 내림차순. 허용: `published_at`, `updated_at`, `title` |

- slug 규칙: `^[a-z0-9]+(-[a-z0-9]+)*$` (기존 `normalizeSlug()` 재사용, 한글→ascii 폴백).
- 없는 slug → 404 `{error:{code:"not_found"}}`.

## 스키마

### 목록 item (요약)

```jsonc
{
  "slug": "string", // URL 키
  "title": "string",
  "summary": "string|null", // frontmatter.summary. 없으면 null (본문 자동 발췌는 요청 시 추가)
  "tags": ["string"],
  "published_at": "ISO8601", // UTC
  "updated_at": "ISO8601", // UTC
  "cover_image_url": "string|null", // 절대 URL
  "reading_time_min": 5, // optional, 없으면 생략
  "status": "published", // draft|published (공개 응답은 항상 published)
}
```

### 상세 = 목록 필드 + 아래

```jsonc
{
  "body_markdown": "string", // frontmatter 제거한 순수 본문. 이미지 경로는 절대 URL로 치환됨
  "frontmatter": {}, // 파싱된 YAML 원본 그대로 (키 임의)
}
```

프로젝트 고유 필드는 별도 컬럼 없이 `frontmatter{}`로 전달:

```jsonc
"frontmatter": {
  "role": "string",
  "period": "2025-01 ~ 2025-06",
  "stack": ["TypeScript", "NestJS"],
  "links": { "repo": "https://...", "live": "https://..." }
}
```

## 예시 응답

### `GET /content/posts?tag=nestjs&page=1&limit=20`

```json
{
  "data": [
    {
      "slug": "hexagonal-nestjs",
      "title": "가벼운 헥사고날로 NestJS 모놀리스 나누기",
      "summary": "포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.",
      "tags": ["nestjs", "architecture"],
      "published_at": "2026-06-24T00:00:00.000Z",
      "updated_at": "2026-07-01T09:12:00.000Z",
      "cover_image_url": "https://raw.githubusercontent.com/oobg/raven-content/main/posts/hexagonal-nestjs/cover.png",
      "reading_time_min": 8,
      "status": "published"
    }
  ],
  "meta": {
    "requestId": "01J...",
    "serverTime": "2026-07-06T10:30:45.123Z",
    "pagination": { "total": 1, "page": 1, "limit": 20 }
  }
}
```

### `GET /content/posts/hexagonal-nestjs`

```json
{
  "data": {
    "slug": "hexagonal-nestjs",
    "title": "가벼운 헥사고날로 NestJS 모놀리스 나누기",
    "summary": "포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.",
    "tags": ["nestjs", "architecture"],
    "published_at": "2026-06-24T00:00:00.000Z",
    "updated_at": "2026-07-01T09:12:00.000Z",
    "cover_image_url": "https://raw.githubusercontent.com/oobg/raven-content/main/posts/hexagonal-nestjs/cover.png",
    "reading_time_min": 8,
    "status": "published",
    "body_markdown": "## 왜 헥사고날인가\n\n![다이어그램](https://raw.githubusercontent.com/oobg/raven-content/main/posts/hexagonal-nestjs/diagram.png)\n\n본문...",
    "frontmatter": {
      "title": "가벼운 헥사고날로 NestJS 모놀리스 나누기",
      "summary": "포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.",
      "tags": ["nestjs", "architecture"],
      "date": "2026-06-24",
      "cover": "cover.png"
    }
  },
  "meta": {
    "requestId": "01J...",
    "serverTime": "2026-07-06T10:30:45.123Z"
  }
}
```

### `GET /content/projects/raven-api`

```json
{
  "data": {
    "slug": "raven-api",
    "title": "raven.kr 백엔드 API",
    "summary": "멀티테넌트 NestJS API를 개인 홈서버에서 운영.",
    "tags": ["backend"],
    "published_at": "2026-06-01T00:00:00.000Z",
    "updated_at": "2026-07-05T00:00:00.000Z",
    "cover_image_url": null,
    "status": "published",
    "body_markdown": "프로젝트 회고 본문...",
    "frontmatter": {
      "role": "1인 개발",
      "period": "2026-06 ~ 진행중",
      "stack": ["TypeScript", "NestJS", "Prisma", "Supabase"],
      "links": { "repo": "https://github.com/oobg/api", "live": "https://api.raven.kr" }
    }
  },
  "meta": { "requestId": "01J...", "serverTime": "2026-07-06T10:30:45.123Z" }
}
```

### 에러 (기존 규약)

```json
{
  "error": { "code": "not_found", "message": "찾을 수 없어요." },
  "meta": { "requestId": "01J...", "serverTime": "2026-07-06T10:30:45.123Z" }
}
```

## revalidation 웹훅 (백엔드 → 프론트)

ingest 커밋 성공 후 백엔드가 프론트로 발사. 프론트 미구현 시 no-op, ISR 주기 폴백.

```
POST {SITE_URL}/api/revalidate
X-Revalidate-Secret: <shared secret>
{ "changed": [{ "type": "post", "slug": "hexagonal-nestjs" }] }
```

## 이미지

- MVP: GitHub raw 절대 URL. `body_markdown` 내 상대 경로와 `cover_image_url` 모두 ingest 시점에 `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`로 치환.
- 전제: 콘텐츠 repo가 public. 추후 R2/Supabase 미러링으로 무중단 스왑 가능 (프론트는 절대 URL만 소비하므로 무영향).

## 범위

- **v1: posts, projects만.** resume/이력·now는 프론트 정적 페이지. 필요 시 동일 셰이프로 콘텐츠 타입 승격.
