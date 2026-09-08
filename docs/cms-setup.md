# CMS 설정

공개 사이트와 관리자 CMS는 하나의 Next.js 앱에서 동작한다. 별도 콘텐츠 API를 두지 않고 Supabase Postgres에 글을 저장하며, Google Identity Services(GIS)의 공식 버튼으로 받은 ID token을 Supabase Auth에서 검증해 관리자 로그인을 처리한다. production 이미지는 Cloudflare R2에, dev 이미지는 홈서버의 전용 local volume에 저장한다. 공개 페이지는 `status = 'published'` 조건으로 직접 조회하므로 draft는 목록과 상세에 나오지 않는다.

## 1. Supabase 프로젝트와 테이블

1. Supabase 프로젝트를 만든다.
2. Supabase CLI로 프로젝트를 연결한 뒤 마이그레이션을 적용한다.

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   적용할 SQL은 `supabase/migrations/20260907000000_create_posts.sql`이다. 이 마이그레이션은 `posts`, `cms_owners`, RLS 정책과 `updated_at` 트리거를 만든다.

3. SQL Editor에서 로그인할 Google 계정을 소문자로 등록한다.

   ```sql
   insert into public.cms_owners (email) values ('owner@example.com');
   ```

`cms_owners` 테이블은 클라이언트에서 직접 읽을 수 없다. `posts`의 `anon`·`authenticated` 공개 SELECT 정책은 published 행만 허용하고, 등록된 owner는 CMS에서 draft를 포함해 관리할 수 있다. Supabase는 노출 스키마의 테이블에 RLS와 최소 권한을 함께 설정할 것을 권장한다. 자세한 기준은 [Supabase Row Level Security 문서](https://supabase.com/docs/guides/database/postgres/row-level-security)를 참고한다.

## 2. Google 로그인

1. Google Auth Platform에서 Web application OAuth client를 만들고 OAuth Branding의 앱 이름을 `raven.kr`로 설정한다.
2. Authorized JavaScript origins에 `http://localhost:3500`과 `https://raven.kr`을 추가한다. GIS 공식 버튼은 이 origin에서 실행된다.
3. Authorized redirect URIs에는 Supabase Dashboard의 Google provider 화면에 표시되는 callback URL을 추가한다. hosted 프로젝트는 보통 `https://<project-ref>.supabase.co/auth/v1/callback` 형식이다. GIS 경로가 이 주소로 브라우저를 이동시키지는 않지만 Supabase Google provider 설정에 필요하다.
4. Supabase Dashboard의 **Authentication → Providers → Google**에서 같은 Web client ID와 secret을 입력하고 provider를 활성화한다. nonce 검증은 끄지 않는다.
5. Supabase **Authentication → URL Configuration**에서 Site URL을 `https://raven.kr`로 설정하고 Redirect URLs에 다음을 추가한다.

   ```text
   http://localhost:3500/auth/callback
   https://raven.kr/auth/callback
   ```

관리자 로그인 화면은 GIS가 발급한 Google credential과 요청마다 새로 만든 nonce를 `signInWithIdToken`에 전달한다. Google에는 SHA-256으로 해시한 nonce를 주고 Supabase에는 원문 nonce를 주어 재사용을 막는다. Supabase의 기본 `signInWithOAuth` redirect fallback은 제공하지 않으므로 로그인 도중 Supabase 프로젝트 도메인으로 이동하지 않는다. [Supabase Google 로그인](https://supabase.com/docs/guides/auth/social-login/auth-google)의 ID token 로그인 절차와 [Google GIS Web 설정](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)을 따른다.

## 3. Cloudflare R2

1. R2 bucket을 만들고, 해당 bucket만 읽고 쓸 수 있는 Object Read & Write API token을 만든다.
2. production에서는 bucket에 custom domain(예: `cdn.raven.kr`)을 연결한다. `r2.dev` 주소는 개발 용도다. R2 bucket은 기본적으로 공개되지 않으므로 공개 읽기를 명시적으로 활성화해야 한다. [R2 public bucket 문서](https://developers.cloudflare.com/r2/buckets/public-buckets/)를 참고한다.
3. 브라우저의 관리자 화면에서 직접 R2로 요청하지 않고 서버 route를 거치므로 업로드용 CORS는 필요하지 않다. 다른 브라우저 origin에서 자산을 fetch하거나 canvas 등으로 읽을 계획이라면 [R2 CORS 문서](https://developers.cloudflare.com/r2/buckets/cors/)에 따라 허용 origin과 method를 제한한다.

업로드 object key는 `assets/posts/<YYYY-MM-DD>/<uuid>.<ext>`이고 에디터에는 같은 키의 root-relative 경로 `/assets/posts/...`가 들어간다. 공개 Markdown renderer는 이를 `${R2_PUBLIC_URL}/assets/posts/...`로 바꾼다. 외부 URL과 `/images/...` 같은 다른 경로는 바꾸지 않으며, `..`, 역슬래시, 잘못된 percent encoding이 포함된 자산 경로는 CDN에 연결하지 않는다.

dev에서는 R2 대신 local backend를 사용한다. 동일한 Markdown 경로를 유지하되 `ASSET_PUBLIC_URL=https://cdn-dev.raven.kr`로 공개 URL을 만든다. CDN nginx가 `/assets/` prefix를 제거해 `/srv/assets` alias를 조회하므로 앱은 mount root 아래 `posts/...`에 기록한다. local backend에는 production R2 credentials를 설정하지 않는다.

## 4. 환경변수

`.env.example`을 `.env.local`로 복사해 채운다.

| 변수                                   | 설명                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `CONTENT_SOURCE`                       | CMS 글을 공개하려면 `supabase`                                                                    |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase Project URL                                                                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. 전환 전 프로젝트는 legacy anon key도 사용 가능                          |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`         | Google Auth Platform의 Web client ID. GIS 공식 버튼과 Supabase Google provider에서 같은 값을 사용 |
| `CMS_OWNER_EMAILS`                     | 관리자 이메일을 쉼표로 구분한 서버 측 allowlist. `cms_owners`와 같은 계정을 등록                  |
| `SITE_URL`                             | callback을 만들 canonical origin. 로컬은 `http://localhost:3500`                                  |
| `R2_ACCOUNT_ID`                        | Cloudflare account ID                                                                             |
| `R2_ACCESS_KEY_ID`                     | R2 API token access key ID                                                                        |
| `R2_SECRET_ACCESS_KEY`                 | R2 API token secret access key                                                                    |
| `R2_BUCKET`                            | R2 bucket 이름                                                                                    |
| `R2_PUBLIC_URL`                        | custom domain origin. 끝 `/`는 선택 사항                                                          |
| `ASSET_STORAGE_BACKEND`                | 기본 `r2`. dev local volume은 `local`                                                             |
| `ASSET_LOCAL_ROOT`                     | local backend의 컨테이너 내부 원본 mount root                                                     |
| `ASSET_PUBLIC_URL`                     | local backend의 공개 origin. dev는 `https://cdn-dev.raven.kr`                                     |

`NEXT_PUBLIC_SUPABASE_*`는 브라우저 bundle에도 들어가므로 Docker build argument로 전달된다. publishable key는 공개 클라이언트용이며 권한은 RLS가 제한한다. `CMS_OWNER_EMAILS`와 R2 credentials는 서버에서만 읽는다. OCI production은 이 값을 호스트의 mode `600` config 파일에서 공급하고 GitHub Actions에 앱 runtime secret을 두지 않는다. 기존 홈서버 workflow를 사용할 때만 해당 환경의 GitHub secrets에서 runtime 값을 공급한다. service role key는 이 앱에서 사용하지 않는다.

## 5. 실행 확인

```bash
pnpm dev
```

1. `http://localhost:3500/admin`에서 Google 공식 버튼이 표시되고 로그인되는지 확인한다.
2. draft 글을 저장하고 `/blog` 및 `/blog/<slug>`에서 노출되지 않는지 확인한다.
3. 글을 발행해 공개 목록과 상세에 표시되는지 확인한다.
4. 이미지를 올려 Markdown에 `/assets/posts/...`가 들어가고 상세 페이지의 HTML이 `R2_PUBLIC_URL`로 시작하는지 확인한다.

dev는 Raven 전용 DB/Auth/REST와 Google OAuth client를 사용하고 기존 Day0와는 외부 Kong 하나만 공유한다. dev client는 `https://dev.raven.kr` origin과 `https://supabase-dev.raven.kr/auth/v1/callback`으로 생성했으며 production과 Day0 client는 변경하지 않았다. `SITE_URL=https://dev.raven.kr`, `SITE_INDEXABLE=false`를 Docker build와 runtime에 전달해 metadata와 Open Graph origin을 dev로 맞추고 `noindex, nofollow`를 확인했다. Raven Auth provider와 database migration을 적용했고 공개 origin에서 Google 로그인, owner 관리자 진입, draft 비공개, 발행 글 공개, local 이미지 업로드와 CDN 변환을 확인했다. 서버 준비와 acceptance는 [`dev-setup.md`](dev-setup.md)를 따른다.

OCI production에서는 표의 runtime 값을 서버 config에 두고 `CONTENT_SOURCE=supabase`로 실행한다. 배포 workflow에는 서버 접속에 필요한 설정만 둔다. 기존 홈서버 workflow를 계속 사용할 경우에는 그 환경의 GitHub secrets와 `CONTENT_SOURCE` variable을 사용한다. `REVALIDATE_SECRET`은 기존 외부 API 호환 웹훅을 사용할 때만 필요하다.

배포는 같은 `CONTENT_SOURCE`를 Docker build와 runtime에 전달한다. Supabase를 읽는 홈·블로그와 인증이 필요한 관리자 화면은 runtime에 렌더링하며, 브라우저 bundle에 필요한 Supabase 공개 변수와 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`는 build 단계에도 전달한다.
