# Raven HTTP API

현재 Next.js CMS의 계약입니다. `docs/api-contract/content-v2.md`는 보관 중인 외부 콘텐츠 API 계약이며, 아래 관리자 CMS API와 다릅니다. API는 현재 실행 환경의 DB와 이미지 저장소에만 접근합니다. 게시글/이미지 저장은 Git 커밋이나 배포가 아닙니다.

## 환경과 인증

| 환경 | 사이트 base URL        | 게시글 DB            | 이미지 저장소 / 공개 URL                                                   |
| ---- | ---------------------- | -------------------- | -------------------------------------------------------------------------- |
| dev  | `https://dev.raven.kr` | self-hosted Supabase | `ASSET_STORAGE_BACKEND=local`, `ASSET_PUBLIC_URL=https://cdn-dev.raven.kr` |
| main | `https://raven.kr`     | hosted Supabase      | R2, `R2_PUBLIC_URL=https://cdn.raven.kr`                                   |

공개 조회는 인증이 필요 없습니다. 새 관리자 posts API와 uploads API는 다음 중 하나를 요구합니다.

- Google owner 세션: Google provider, 인증된 이메일, `CMS_OWNER_EMAILS`, DB의 `is_cms_owner()` RPC 조건을 모두 통과해야 합니다. GET을 포함해 `Origin`은 `SITE_URL`과 정확히 일치해야 합니다(설정의 마지막 `/` 제외). 이 경로는 세션 DB 클라이언트와 기존 RLS를 사용합니다.
- Cloudflare Access: 앱 policy가 허용한 사용자/서비스 주체만 사용할 수 있습니다. origin 서버도 `Cf-Access-Jwt-Assertion`을 `jose` remote JWKS와 `jwtVerify`로 검증합니다. RS256 서명, issuer, audience, 필수 `exp`와 만료, `nbf`(존재 시)를 확인합니다. 이메일·`CF-Access-Client-Id`·임의 헤더의 존재는 인증이 아닙니다. 검증된 Access 요청만 Origin 없이 허용하며, Origin이 있으면 역시 정확히 일치해야 합니다.

같은 출처의 유효한 owner 세션이 있으면 세션 경로를 우선합니다. owner 인증을 통과하지 못해도 유효한 Access JWT가 있으면 Access 경로를 사용할 수 있습니다. 다른 Origin은 JWT가 유효해도 거부합니다. CORS를 통한 다른 출처의 브라우저 쓰기는 지원하지 않습니다.

`CLOUDFLARE_ACCESS_TEAM_DOMAIN`, `CLOUDFLARE_ACCESS_AUDIENCE`, `CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE`는 환경별 runtime secret으로 주입합니다. 실제 팀 도메인, AUD, 서비스 토큰 값을 커밋하지 않습니다. 팀 값은 `https://<team>.cloudflareaccess.com` 같은 HTTPS origin만 허용하며, 인증서 URL은 `<team>/cdn-cgi/access/certs`입니다. `CLOUDFLARE_ACCESS_AUDIENCE`는 관리자 posts/uploads Access 앱, `CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE`는 별도 production docs Access 앱의 AUD이며, 두 AUD는 반드시 서로 다른 앱에서 발급해야 합니다. 팀 origin은 두 앱이 공유하고 AUD 선택만 서로 독립적입니다. docs AUD가 없어도 완전하게 설정된 관리자 인증에는 영향이 없지만 docs 접근은 거부됩니다. 관리자 Access는 팀과 관리자 AUD가 모두 없으면 비활성화되고, 둘 중 하나만 없거나 값이 올바른 HTTPS origin이 아니면 owner 요청을 포함해 fail closed(503)합니다. 공유 팀이 docs에 설정되어 있어도 관리자 AUD가 없으면 이 기존 관리자 partial-config 규칙이 적용됩니다. `SITE_URL` 누락도 503입니다.

관리자 Access 앱 범위는 필요한 posts/uploads 경로로 제한하고 정책을 명시적으로 구성해야 합니다. docs Access 앱은 `raven.kr/api/docs*` 경로만 대상으로 별도 구성합니다. 이 앱의 Allow Include Emails에는 `yoonseok.bae98@gmail.com`만 exact match로 넣고, 기본 정책은 전부 거부(default deny)로 유지하며 Everyone/BYPASS/service allow를 추가하지 않습니다. 서비스 토큰 요청은 Cloudflare edge에 `CF-Access-Client-Id`와 `CF-Access-Client-Secret`을 보내며, edge가 검증한 JWT assertion을 origin에 전달해야 합니다. origin은 이 두 서비스 헤더만으로 허용하지 않습니다. JWKS 조회를 위한 서버의 HTTPS 연결도 필요합니다. [Cloudflare JWT 검증 문서](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [jose](https://github.com/panva/jose).

Access 게시글 경로는 인증 완료 뒤에만 `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 서버 전용 클라이언트를 만듭니다. 기존 endpoint guard를 그대로 사용하므로 dev에서는 `SITE_URL=https://dev.raven.kr`, `SUPABASE_INTERNAL_URL=http://raven-supabase-dev-rest:3000`이 필요합니다. main에서는 내부 dev endpoint를 설정하지 않고, HTTPS `NEXT_PUBLIC_SUPABASE_URL`과 해당 프로젝트 publishable/service-role 키를 사용합니다. DB 마이그레이션 및 service-role 권한은 별도로 준비되어 있어야 합니다.

dev는 `ASSET_LOCAL_ROOT`가 앱에 쓰기 가능하고 CDN nginx와 공유되어야 합니다. `/assets/` URL prefix는 nginx alias가 제거하므로 파일은 예를 들어 `<root>/posts/2026-09-10/image.png`에 저장됩니다. local 설정에 R2 credentials를 섞으면 설정 오류입니다. main은 `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`이 필요합니다.

## 관리자 게시글

| 요청                          | 의미                         | 성공 응답                                                             |
| ----------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `POST /api/admin/posts`       | 새 글 생성; 중복 slug는 409  | 201 `{ "post": { ... }, "created": true }`                            |
| `PUT /api/admin/posts/[slug]` | slug 기준 생성 또는 갱신     | 생성 201 / 갱신 200 `{ "post": { ... }, "created": true 또는 false }` |
| `GET /api/admin/posts/[slug]` | 인증 후 draft/published 조회 | 200 `{ "post": { ... } }`, 없으면 404                                 |

모든 관리자 posts/uploads 응답은 `Cache-Control: no-store`입니다. GET은 생성·업데이트 결과 확인용이며 공개 응답과 달리 `post`로 감쌉니다. 반환되는 post에는 DB `id`, `created_at`, `updated_at`, 아래 필드 및 서버 파생 `cover_image_url`이 포함됩니다.

쓰기 요청은 `Content-Type: application/json`이어야 합니다. 전체 요청은 **1,000,000 bytes**, Markdown `body`는 **200,000 JavaScript 문자열 길이 단위** 이하여야 합니다. 실제 스트림 크기도 검사합니다. 입력 예:

```json
{
  "title": "디자인 시스템 기록",
  "slug": "design-system",
  "description": "설계와 구현 과정을 정리했습니다.",
  "body": "# 기록\n\n![구조](/assets/posts/2026-09-10/design-system-00-v2.png)",
  "status": "published",
  "category_id": "00000000-0000-4000-8000-000000000001",
  "tags": ["design", "engineering"],
  "cover_image_key": "assets/posts/2026-09-10/design-system-00-v2.png",
  "cover_alt": "디자인 시스템의 구조",
  "cover_position_x": 0.5,
  "cover_position_y": 0.5,
  "published_at": "2026-09-10T03:00:00Z",
  "pin_order": 1
}
```

필수 필드는 `title`(trim 후 1–160자), `slug`(NFC 정규화, 1–160자, 한글·영문 소문자·숫자와 단어 사이 하이픈), `description`(trim 후 1–500자), `body`(비어 있지 않은 Markdown), `status`(`draft|published`)입니다. `body`는 HTML이 아니며 원문 그대로 저장합니다. 공개 상세 응답의 같은 내용은 `body_markdown`입니다. API 쓰기에 `body_markdown`이나 `cover_image_url`을 보내면 422입니다. 그 외 알 수 없는 필드도 거부합니다.

`category_id`는 대상 DB에 존재하는 UUID이며 생략하면 위의 미분류 UUID입니다. `tags`는 최대 30개, 항목당 1–80자이며 정확히 같은 값은 중복 제거합니다. 기존 입력 의미대로 쉼표 문자열도 허용하고 이 경우 trim·소문자 변환을 합니다. 배열 항목은 자동 소문자 변환하지 않습니다.

`cover_image_key`는 아래 업로드 키 규칙을 따르며 생략/null이면 커버가 없습니다. 서버가 **현재 storage config의 publicUrl + key**로 `cover_image_url`을 파생합니다. 외부 절대 URL을 직접 저장할 수 없습니다. 위치 x/y는 0–1(기본 0.5), `cover_alt`는 trim 후 1–300자 또는 null이며 빈 문자열은 null로 처리합니다.

`published_at`은 선택 ISO 8601 시각(Z 또는 offset), `pin_order`는 선택 정수 1–5 또는 null입니다. published 신규 생성에서 시각이 없거나 null이면 서버 현재 시각을 사용합니다. published 갱신에서는 명시한 시각을 사용하고, 생략/null이면 기존 발행 시각을 유지합니다. `pin_order` 생략은 기존 순서를 유지하고, null은 해제합니다. 신규 생성의 생략값은 null입니다. draft는 발행 시각·pin이 null이어야 하며 non-null 입력은 422입니다. published에서 draft로 바꿀 때 두 필드를 생략해도 null로 지웁니다.

PUT은 전체 게시글 저장 계약입니다. slug가 본문과 경로에서 다르면 400이며, slug 변경 기능은 아닙니다. 선택 콘텐츠 필드 생략 시 스키마 기본값으로 저장되므로 동기화할 메타데이터를 모두 보내세요. 같은 slug로 재실행하면 동일한 글 ID를 갱신하고 중복 글을 만들지 않습니다. DB unique slug 제약으로 동시 생성도 중복을 막으며 충돌 시 해당 slug를 재조회해 갱신합니다. `created_at`/ID는 보존하지만 DB trigger의 `updated_at`은 다시 바뀔 수 있습니다. 동시 수정에는 마지막으로 성공한 쓰기가 반영됩니다.

pin 순서가 다른 글과 충돌하면 409이고, 없는 카테고리나 DB check/FK 위반은 422입니다. 카테고리를 자동 생성하거나 다른 글의 pin을 빼앗지 않습니다. 순서를 서로 바꾸는 동기화는 필요한 기존 pin을 `pin_order:null`로 해제한 뒤 최종 순서를 다시 적용하세요. main/dev의 카테고리 UUID가 다르면 대상 카테고리로 매핑해야 합니다.

draft는 관리자 조회에서만 보이고 공개 API는 published만 반환합니다. `published_at` 미래 시각은 예약 발행 기능이 아닙니다. status가 published면 공개 조건을 충족합니다. 저장 성공 시 기존 UI와 동일한 공개 캐시 태그 및 `/`, `/blog`, `/admin`, 해당 `/blog/[slug]` 경로를 무효화합니다. 실제 공개 조회는 `CONTENT_SOURCE=supabase` 환경에서 해당 DB를 사용하며 mock/legacy API 모드라면 별도 source를 읽습니다.

## 이미지 업로드 → 글 저장

`POST /api/admin/uploads`는 multipart `file` 필수, `key` 선택입니다. 파일은 비어 있지 않은 JPEG/PNG/GIF/WebP만 지원하고 MIME과 기존 파일 signature 검사를 모두 통과해야 합니다. 파일 최대 10 MiB, multipart 전체 최대 11 MiB입니다(선언값과 실제 스트림 검사).

키는 `assets/posts/YYYY-MM-DD/<safe filename>.<extension>`이며 앞에 `/`를 붙이지 않습니다. 날짜는 유효한 달력 날짜이고, filename은 영숫자로 시작하는 1–200자의 영숫자·`_`·`-`입니다. 확장자는 소문자 `jpg|png|gif|webp`이며 업로드 MIME과 일치해야 합니다. 경로 이동·절대 경로·URL·인코딩된 경로·SVG는 허용하지 않습니다. key를 생략하면 기존 날짜 + UUID 형식으로 생성합니다.

성공은 201:

```json
{
  "path": "/assets/posts/2026-09-10/design-system-00-v2.png",
  "url": "/assets/posts/2026-09-10/design-system-00-v2.png",
  "publicUrl": "https://cdn-dev.raven.kr/assets/posts/2026-09-10/design-system-00-v2.png"
}
```

`path`/`url`은 Markdown에 넣을 사이트 루트 상대 경로입니다. 커버에는 path의 맨 앞 `/`를 제거한 키를 사용합니다. publicUrl은 실행 환경에서 파생되며 main이라면 main CDN입니다. 본문의 기존 절대 이미지 URL은 서버가 재작성하지 않으므로, 동기화 도구가 루트 상대 `/assets/...`로 바꾸거나 대상 환경 주소로 치환해야 합니다.

동일 키가 있으면 local의 atomic link 또는 R2의 conditional write(`If-None-Match: *`)가 덮어쓰기를 막고 409 `ASSET_EXISTS`를 반환합니다. 동기화 도구는 대상 CDN의 파일을 읽어 원본과 해시가 같은지 확인한 후에만 skip해야 합니다. 409 자체는 동일 내용의 증거가 아닙니다. 다른 내용이면 새 키를 사용하세요. 키 없는 재업로드는 새 UUID를 생성하므로 idempotent하지 않습니다.

다음 예시의 변수는 로컬 런타임에서 주입하고 토큰을 저장소나 로그에 남기지 않습니다. 서비스 자격 증명은 edge로 보내는 값이며 JWT assertion은 edge가 전달합니다.

```sh
API_BASE=https://dev.raven.kr

curl --fail-with-body "$API_BASE/api/admin/uploads" \
  -H "CF-Access-Client-Id: $ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $ACCESS_CLIENT_SECRET" \
  -F 'file=@./design-system-00-v2.png;type=image/png' \
  -F 'key=assets/posts/2026-09-10/design-system-00-v2.png'

# post.json은 위 JSON 계약을 따릅니다. 이미지를 먼저 올린 뒤 실행합니다.
curl --fail-with-body -X PUT "$API_BASE/api/admin/posts/design-system" \
  -H "CF-Access-Client-Id: $ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $ACCESS_CLIENT_SECRET" \
  -H 'Content-Type: application/json' --data-binary @post.json

curl --fail-with-body "$API_BASE/api/admin/posts/design-system" \
  -H "CF-Access-Client-Id: $ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $ACCESS_CLIENT_SECRET"

# Google owner 세션을 사용할 때: 유효한 세션 cookie jar + 정확한 Origin
curl --fail-with-body -X POST "$API_BASE/api/admin/posts" \
  -b session.cookies -H "Origin: $API_BASE" \
  -H 'Content-Type: application/json' --data-binary @post.json
```

## 오류

새 posts와 uploads 오류는 `{ "error": { "code": "POST_CONFLICT", "message": "슬러그 또는 고정 순서가 이미 사용 중입니다." } }` 형태입니다. DB 오류 상세·토큰·입력 원문은 응답이나 새 API 로그에 남기지 않습니다.

| 상태 | 의미 / 주요 code                                                                      |
| ---- | ------------------------------------------------------------------------------------- |
| 400  | 잘못된 JSON·multipart·slug, `SLUG_MISMATCH`, 누락 파일, 빈 파일 또는 10 MiB 초과 파일 |
| 401  | `UNAUTHORIZED`: Google 로그인/JWT 검증 실패                                           |
| 403  | `FORBIDDEN`: Origin 오류, Origin 없는 비-Access 요청, owner/RLS 권한 부족             |
| 404  | `POST_NOT_FOUND`                                                                      |
| 409  | `POST_CONFLICT`, `ASSET_EXISTS`                                                       |
| 413  | `PAYLOAD_TOO_LARGE`: 요청/Markdown 크기 초과                                          |
| 415  | uploads의 `UNSUPPORTED_IMAGE`, `INVALID_IMAGE`                                        |
| 422  | `INVALID_POST`, `INVALID_ASSET_KEY`: 입력·FK·DB check 위반                            |
| 500  | `DATABASE_ERROR`, `INTERNAL_ERROR`: 안전한 일반 메시지                                |
| 503  | `NOT_CONFIGURED`, `AUTH_UNAVAILABLE`: 서버 설정 또는 인증 서비스 사용 불가            |

## 기존 공개 API

| 요청                              | 현재 계약                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/posts`                  | `{featured, categories, sections, archive}`. archive는 `{items,page,pageSize,totalItems,totalPages}`. 필터 `q`(최대 200자), `category`(카테고리 slug), `tag`(최대 80자), `page`(기본 1), `pageSize`(기본 12, 최대 100). 잘못된 필터 400, 조회 실패 500.                                                    |
| `GET /api/posts/[slug]`           | published 글 객체를 직접 반환. `slug,title,summary,tags,published_at,updated_at,status,category,cover_image_key,cover_image_url,cover_position:{x,y},cover_alt,pin_order,body_markdown,frontmatter`. draft/없음 404, 잘못된 주소 400.                                                                      |
| `GET /api/posts/[slug]/comments`  | `{items,total,nextCursor}`. 공개 글의 visible 댓글만, 페이지 20개. 다음 요청은 `?cursor=<nextCursor>` 그대로 전송. 잘못된 cursor 400, 비공개/없는 글 404.                                                                                                                                                  |
| `POST /api/posts/[slug]/comments` | 비로그인 허용. 정확한 SITE_URL Origin과 JSON 필요. `{nickname,avatar_id,body}` → 201 `{comment}`. nickname trim 후 1–20자, avatar `clay-01`~`clay-64`, body trim 후 1–1000자. 400/403/404/415/429/500 가능. 429는 `Retry-After: 600`.                                                                      |
| `POST /api/revalidate`            | 공개 URL에 있는 인증된 webhook. `x-revalidate-secret`이 `REVALIDATE_SECRET`과 일치해야 함. `{changed:[{type:"post" 또는 "project",slug:"..."}]}`(최대 100건). 생략/빈 changed는 전체 목록 태그 무효화. 200 `{revalidated:true,count}`. 64 KiB 제한, 400/401/413/500. Access/Google 인증으로 대체되지 않음. |

공개 posts 응답 오류는 기존 `{error:"문구"}`이며 comments는 `{error:{code,message}}`, revalidate는 `{error:"영문 메시지"}`입니다. 공개 posts는 HTTP `no-store`를 보내지만 내부 Next 서버 데이터 캐시는 별도로 존재합니다. 댓글은 Markdown 렌더가 아닌 텍스트 계약이며 반환 comment는 `{id,nickname,avatar_id,body,created_at}`입니다.

```sh
curl 'https://dev.raven.kr/api/posts?page=1&pageSize=12'
curl 'https://dev.raven.kr/api/posts/design-system'
curl 'https://dev.raven.kr/api/posts/design-system/comments'
```

## API 명세 문서 (운영 전용)

`GET /api/docs`는 이 문서의 기계 가독형인 OpenAPI 3.1 JSON을 반환합니다. **운영 환경(`https://raven.kr`)에서만 활성화**됩니다. 다른 환경(`dev.raven.kr`, localhost 등)은 SITE_URL이 일치하지 않으므로 403을 반환합니다.

### 접근 방법

Cloudflare Zero Trust 대시보드에 **`raven.kr/api/docs*`** 경로를 대상으로 하는 Access 앱을 별도 구성합니다. 정책은 `yoonseok.bae98@gmail.com`만 허용하며 기본은 전부 거부(default deny)입니다.

```sh
# Cloudflare Access 터널을 통해 접근 — edge가 Cf-Access-Jwt-Assertion을 자동 주입합니다.
open https://raven.kr/api/docs
```

### 검증 절차

origin 서버는 다음 순서로 검증하며 어느 단계에서든 실패하면 fail closed합니다.

1. `SITE_URL` 환경 변수를 trim·trailing slash 제거 후 `https://raven.kr`과 정확히 비교합니다.
2. `CLOUDFLARE_ACCESS_TEAM_DOMAIN`과 `CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE`로 docs 전용 Access 설정을 가져옵니다. 팀 origin 또는 docs AUD가 없거나 형식이 잘못되면 거부합니다. 이 설정은 관리자 `CLOUDFLARE_ACCESS_AUDIENCE`로 fallback하지 않습니다.
3. `Cf-Access-Jwt-Assertion` 헤더만 읽습니다. Google 세션·서비스 토큰·다른 헤더는 인증 수단으로 사용하지 않습니다.
4. `verifyCloudflareAccessJwt`로 JWT를 검증합니다. jose JWKS 원격 조회, RS256 서명, 설정된 팀 issuer, audience, `exp`, `nbf`(존재 시)를 모두 확인합니다.
5. JWT 페이로드의 `email` 필드를 소문자로 변환 후 `yoonseok.bae98@gmail.com`과 정확히 비교합니다.

모든 응답(성공·오류)에 `Cache-Control: private, no-store`와 `Vary: Cf-Access-Jwt-Assertion`을 포함합니다.

| 상태 | 조건                                                             |
| ---- | ---------------------------------------------------------------- |
| 200  | 운영 환경·Access 설정·유효 JWT·정확한 이메일 모두 통과           |
| 401  | `Cf-Access-Jwt-Assertion` 헤더 없음 또는 JWT 서명·만료 검증 실패 |
| 403  | 비운영 환경, Access 미설정, 이메일 불일치, 기타 모든 실패        |

## 기존 관리자 API

아래 경로는 기존 **Google owner 전용** 계약을 유지합니다. 새 posts/uploads의 Access 지원이 자동으로 적용되지 않습니다.

| 요청                         | 현재 계약                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/admin/preview`    | owner + 정확한 Origin. JSON `{markdown}` → `{html}`. Markdown 200,000자, raw 요청 1,000,000자 제한. 성공 no-store. 400/401/403/413/500/503, 오류 `{error:"문구"}`. |
| `GET /api/admin/comments`    | owner. 최신 200개 `{items}`; 각 항목은 comment + `post_slug,moderation_status`.                                                                                    |
| `PATCH /api/admin/comments`  | owner. `{id:<UUID>,status:"visible" 또는 "hidden"}` → `{comment}`.                                                                                                 |
| `DELETE /api/admin/comments` | owner. `{id:<UUID>}` → 204, 본문 없음.                                                                                                                             |

댓글 관리자 경로는 현행 코드상 별도 Origin 검사가 없으며 owner 검사를 수행한 뒤 댓글 service-role 서비스로 전달합니다. 잘못된 관리 입력은 400, owner 오류 401/403/503, 처리 실패 500이며 `{error:{code,message}}`와 no-store를 사용합니다. 이 기존 댓글 경로는 새 게시글 API의 세션/Access DB 클라이언트 분기와 별개입니다.
