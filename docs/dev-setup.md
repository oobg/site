# Raven 개발 환경 설정

`dev.raven.kr`은 홈서버의 Raven 전용 Next.js 앱과 self-hosted Supabase를 사용한다. 기존 Day0 Supabase와 외부 Kong gateway 하나를 공유하지만 database, Auth, REST, API key, 이미지 자격증명, Compose project와 volume은 분리한다. 프로젝트 조직 관리 UI는 두지 않는다. 이 문서는 외부 DNS나 tunnel을 바꾸기 전에 내부 구성을 준비하고 검증하는 절차다.

## 공개 연재 slug 정렬 계약

현재 공개 연재는 `design-system-NN-*`와 `ai-memory-NN-*` 두 형식이며 `NN`은 두 자리 편 번호다. 카테고리 전체 글은 이 zero-padded slug를 오름차순으로 조회해 `00` 프롤로그 또는 `01`부터 표시한다. 상세 화면의 관련 글은 같은 시리즈의 편 번호 거리가 가까운 글을 먼저 보여 주고, 거리가 같으면 이전 편을 우선한다. 새 연재를 추가할 때는 `src/features/posts/utils/series.ts`의 registry와 회귀 테스트를 함께 갱신한다.

## 디렉터리와 서비스 경계

홈서버에는 다음 경계를 사용한다.

- `/srv/docker/raven-dev/app`: 검증한 `dev` 소스
- `/srv/docker/raven-dev/config/.env.dev`: mode `600`인 앱 설정
- `/srv/docker/raven-dev/config/DEPLOY_TARGET`: 내용이 정확히 `raven-dev`인 배포 표식
- `/srv/docker/raven-dev/supabase`: Raven 전용 DB/Auth/REST 구성
- `/srv/docker/raven-cdn-dev/assets`: dev 이미지 원본. 앱은 `/srv/assets`에 read-write로, wsrv는 read-only로 마운트한다.

홈서버는 SELinux Enforcing이다. 앱 mount의 `z` 옵션은 이 원본에 shared container label을 적용한다. wsrv의 Docker mount 권한은 계속 read-only다. 최초 앱 기동 뒤 두 컨테이너에서 읽기와 앱의 원자적 쓰기를 함께 확인한다.

앱 Compose project는 `raven-dev`, 컨테이너는 `raven-web-dev`다. 호스트 포트를 publish하지 않고 기존 `nginx-proxy-manager_default` 네트워크에 `3000`만 expose한다. Supabase와 CDN, tunnel은 앱 배포 스크립트의 수명주기에 포함하지 않는다. Raven DB/Auth/REST는 전용 bridge에 두고 기존 Kong만 이 bridge에 연결한다. Raven upstream에는 `raven-auth`, `raven-rest`처럼 기존 서비스와 겹치지 않는 network alias를 사용한다.

## Supabase source 준비

[`docker/dev/supabase/UPSTREAM`](../docker/dev/supabase/UPSTREAM)은 Supabase 공식 저장소의 기준 tag와 commit을 기록한다. Raven은 여기서 database, Auth, REST와 bootstrap 설정을 사용하고 gateway는 새로 기동하지 않는다. 외부 요청은 현재 운영 중인 단일 Kong이 Host로 Day0와 Raven을 나눈다.

1. `/srv/docker/raven-dev`와 `config/DEPLOY_TARGET` 표식을 만든다.
2. [`docker/dev/supabase/install.sh`](../docker/dev/supabase/install.sh)을 홈서버에서 실행한다. 기존 대상이 있으면 덮어쓰지 않고 중단한다.
3. `/srv/docker/raven-dev/supabase/docker/.env.example`을 같은 디렉터리의 `.env`로 복사하고 mode를 `600`으로 설정한다. `umask 077` 상태에서 `sh utils/generate-keys.sh --update-env >/dev/null`과 `sh utils/add-new-auth-keys.sh --update-env >/dev/null`을 실행한다. `--update-env`가 없으면 생성값이 적용되지 않고 stdout에 출력될 수 있다. 명령 실패 때도 secret이 담긴 stdout을 CI나 공유 로그에 복사하지 않는다. 예제 secret으로 stack을 시작하지 않는다.
4. 설치된 `docker/env.raven-dev.example`의 URL과 Google 키 이름을 private `.env`에 추가한다. 제안 hostname을 실제 확정값으로 바꾼다.
5. stack은 설치된 관리 wrapper로만 다룬다. Raven database, Auth, REST의 container, volume, JWT secret과 API key를 Day0와 분리하고 host port를 publish하지 않는다.
6. 공유 Kong에는 `supabase-dev.raven.kr`의 `/auth/v1`과 `/rest/v1`만 Raven upstream으로 보내는 exact-host route를 준비한다. callback 같은 공개 Auth route에도 같은 Host 조건을 둔다. Raven 전용 consumer와 ACL group을 사용해 Day0 key가 Raven route를 통과하거나 Raven key가 Day0 route를 통과하지 못하게 한다.
7. 같은 Raven Host의 허용되지 않은 path는 Kong에서 404로 끝낸다. 기존 Day0 hostless route는 유지하므로 Kong 자체의 임의 Host 차단 수단으로 보지 않는다. tunnel hostname과 고정 `httpHostHeader`는 올바른 upstream 선택을 위한 장치이며 인증 경계가 아니다. 실제 권한 경계는 프로젝트별 key, JWT, database와 RLS다. Kong의 host bind와 방화벽을 확인해 의도하지 않은 외부 경로가 있는지도 별도로 기록한다.
8. 공유 Kong의 DB-less 설정은 전체 파일을 한 번에 교체한다. 현재 원본 hash가 예상값과 같은지 확인하고 Day0 전체 설정을 보존한 합성본만 적용한다. mounted source와 runtime을 함께 갱신하고 이전 전체 설정을 rollback 자료로 남긴다.
9. `SUPABASE_PUBLIC_URL=https://supabase-dev.raven.kr`, `API_EXTERNAL_URL=https://supabase-dev.raven.kr/auth/v1`, `SITE_URL=https://dev.raven.kr`을 서로 일치시킨다. DB port는 공개 ingress에 연결하지 않는다.

공식 `docker-compose.logs.yml`은 사용하지 않는다. 이 선택 override의 Vector service는 Docker socket을 읽으므로 Raven 범위 밖의 기존 컨테이너 로그에 접근할 수 있다. Raven dev에는 해당 권한과 로그 수집이 필요하지 않다.

## Google Auth

dev 전용 Google Web application client는 Raven 프로젝트에 생성했다. production과 Day0 client ID 및 secret을 재사용하거나 수정하지 않는다.

- Authorized JavaScript origin: `https://dev.raven.kr`
- Google callback: Raven dev Supabase origin의 `/auth/v1/callback`
- Supabase `GOTRUE_SITE_URL`: `https://dev.raven.kr`
- 허용 redirect: `https://dev.raven.kr/auth/callback`

공식 self-hosted OAuth 설정에 따라 Auth service에 `GOTRUE_EXTERNAL_GOOGLE_ENABLED`, client ID, secret, redirect URI를 전달한다. nonce 검증은 끄지 않는다. 내부 준비 단계에서는 gateway의 `/auth/v1/settings`에서 Google provider가 활성화됐는지만 확인하고 값은 로그에 출력하지 않는다. 실제 browser login은 dev HTTPS route가 공개된 뒤 확인한다.

## 데이터베이스와 RLS

새 테이블이나 RPC migration을 `psql`로 직접 적용한 뒤에는 migration에 포함된
`notify pgrst, 'reload schema'`가 실행됐는지 확인한다. 앱 acceptance 전에 PostgREST schema
cache가 갱신되지 않으면 존재하는 테이블도 `PGRST205`로 응답할 수 있다.

새 Raven DB에 `supabase/migrations`를 순서대로 적용한다. 적용 전에 대상 DB가 Raven 전용인지 확인하고 SQL을 검토한다. production dump를 복원하거나 Day0 DB를 migration 대상으로 사용하지 않는다. 이미 데이터가 있는 DB에는 자동 down migration이나 초기화를 실행하지 않는다.

RLS 검증은 gateway를 통해 수행한다.

1. publishable key의 비로그인 요청은 published 글만 읽는다.
2. draft 상세와 목록은 비로그인 요청에서 보이지 않는다.
3. owner가 아닌 로그인 사용자는 쓰기를 거부당한다.
4. `cms_owners`에 등록된 dev owner만 draft 생성, 수정, 발행할 수 있다.

RLS policy와 함께 `anon`, `authenticated`의 table grant도 확인한다. secret/service-role key로 acceptance를 수행하면 RLS를 우회하므로 사용하지 않는다.

2026-09-10에는 앱 배포 뒤 `20260910000000_add_blog_taxonomy_and_featured_posts.sql`이 Raven dev DB에 적용되지 않아 공개 글 API가 500을 반환하고 관리자 데이터 조회가 실패했다. 대상이 `raven-supabase-dev-db`의 `postgres` DB임을 확인하고 백업한 뒤 해당 migration 하나만 트랜잭션으로 적용했다. 기존 `posts`는 0행이었고 RLS와 네 정책을 보존했으며, 적용 뒤 taxonomy 필드의 비로그인 REST 조회가 200을 반환했다.

dev 자동 배포 workflow는 앱 이미지만 배포하며 database migration을 실행하지 않는다. 새 migration이 포함된 배포는 Raven 전용 DB와 백업을 확인하고 migration을 별도 적용한 뒤 앱 API를 검증해야 한다.

## 앱 설정과 배포 준비

[`deploy/env.dev.example`](../deploy/env.dev.example)을 `/srv/docker/raven-dev/config/.env.dev`의 키 목록으로 사용한다. 실제 값을 저장소에 넣지 않고 파일 mode를 `600`으로 둔다.

애플리케이션 소스는 main과 같다. dev에서는 `SITE_URL=https://dev.raven.kr`, `SITE_INDEXABLE=false`, Raven dev 전용 Supabase·Google 값과 아래 local asset 변수를 주입한다. production은 같은 코드에 production origin, `SITE_INDEXABLE=true`, production Supabase·Google 값과 R2 backend를 주입한다. hostname으로 검색 허용 여부를 추론하지 않는다. 이 환경 계약은 dev 구현과 acceptance를 통과했다.

로컬 이미지 adapter 계약은 다음과 같다.

- `ASSET_STORAGE_BACKEND=local`
- `ASSET_LOCAL_ROOT=/srv/assets`
- `ASSET_PUBLIC_URL=https://cdn-dev.raven.kr`

local mode에서 R2 account, access key, secret, bucket 또는 `R2_PUBLIC_URL`이 설정되면 배포가 중단된다. production 기본 R2 adapter와 dev local adapter의 설정을 한 파일에 섞지 않는다.

[`deploy/server/deploy-dev.sh`](../deploy/server/deploy-dev.sh)은 정확한 40자리 SHA를 받아 marker, 파일 권한, dev origin, local asset 계약, 기존 tunnel network와 CDN 원본 디렉터리를 검사한다. 앱 이미지만 build하고 내부 `/health`를 확인한다. 기동 또는 health 실패 시 `previous` 앱 이미지만 재기동하며 Supabase, CDN, tunnel은 변경하지 않는다.

서버에 소스를 전달하기 전에 `python3 deploy/server/dev-source.py prepare <Git checkout> <새 snapshot 디렉터리>`를 실행한다. helper가 실제 Git HEAD와 status에서 base SHA와 clean/dirty 상태를 정하고 source를 복사하며 app root의 `.raven-release`까지 생성한다. 수동으로 상태 문자열을 작성하지 않는다. digest는 [`docker/dev/Dockerfile.dockerignore`](../docker/dev/Dockerfile.dockerignore)의 build context와 같이 `.git`, `.next`, `node_modules`, `docs`, `.env`, `.env.*`, `*.env`, `.superpowers`와 manifest 자체를 제외하고 나머지 file·symlink의 path, mode, content hash를 정렬해 계산한다. symlink 권한 비트는 운영체제마다 다르게 보이므로 `777`로 정규화한다. 배포 스크립트는 같은 helper로 staged source의 digest를 다시 계산한다. clean source는 Git SHA tag, dirty source는 `snapshot-<digest 앞 16자리>` tag를 사용해 provenance를 구분한다. 향후 dev workflow도 helper가 만든 새 snapshot만 전달해야 한다.

앱 root filesystem은 read-only다. Next.js runtime cache만 `/app/.next/cache` tmpfs에 둔다. 실제 홈서버 smoke test에서 write 오류와 cache 동작을 확인해야 하며, 재시작하면 이 cache는 비워진다.

### Tunnel connector 운영 계약

Raven tunnel은 Docker network에 연결된 connector 하나만 운영한다. 호스트의 `cloudflared.service`와 자동 업데이트 timer는 비활성 상태로 유지하고, tunnel origin은 동적 container IP가 아닌 `raven-web-dev`, `raven-cdn-dev`, `supabase-kong` 서비스 이름을 사용한다.

2026-09-11에는 자정 자동 업데이트 timer가 호스트 cloudflared를 재시작해 중복 connector가 생겼다. 호스트 connector는 Docker DNS 이름을 해석하지 못해 dev 앱, Supabase, CDN 요청 일부가 502를 반환했다. 호스트 서비스와 timer를 중지·비활성화하고 Docker connector만 남긴 뒤 서비스 이름 기반 ingress를 복원했다.

검증할 때 Access의 302만으로 앱 정상 여부를 판정하지 않는다. 로그인 세션에서 앱 API가 공개 글 16편을 반환하고 홈 화면이 실제 목록을 렌더링하는지 확인하며, 새 CDN URL도 cache-bust 요청으로 200과 올바른 이미지 content type을 확인한다.

## 공개 전 확인

외부 hostname을 추가하기 전에 홈서버 내부에서 다음을 확인한다.

1. 공식 Supabase stack의 DB, Auth, REST, gateway health
2. publishable key를 사용한 REST/RLS allow·deny
3. 앱 컨테이너 안에서 확인한 `http://127.0.0.1:3000/health` 응답과 browser/SSR 양쪽에서 도달 가능한 Supabase public URL
4. `raven-cdn-dev`의 내부 `/health`와 새 원본 이미지 읽기
5. 의도적 앱 health 실패와 `previous` 이미지 rollback

이 검증이 끝난 뒤 기존 tunnel ingress를 읽어 관리 방식을 확인한다. 기존 rule과 connector를 수정하거나 재시작하지 않고 `dev.raven.kr`을 `raven-web-dev:3000`에 연결하는 hostname만 추가한다. `cdn-dev.raven.kr`의 기존 route는 유지한다.

dev HTTPS route를 공개한 뒤 browser에서 Google login, owner 접근, draft 비공개, publish 공개, local upload와 `cdn-dev.raven.kr` 변환을 acceptance한다.

dev 자동 배포 workflow는 위 내부 검증과 rollback 결과를 반영해 `.github/workflows/deploy-dev.yml`에 등록했다. trigger는 `dev` push와 수동 실행으로 제한하고, 입력 SHA가 `origin/dev`에 포함됐는지 확인한다. 기존 main push workflow는 변경하지 않았다. 원격 workflow는 test, typecheck, lint가 모두 통과한 snapshot만 배포한다.

Raven DB/Auth/REST와 provider, migration, 공유 gateway를 적용했다. 실제 gateway에서 Day0와 Raven의 정상 key는 각자 REST에만 200을 받았고 교차 key는 403, Raven 무인증 REST는 401, callback은 Raven Auth로 303, Raven의 허용되지 않은 path는 404였다. Day0 내부 앱은 적용 뒤에도 healthy 상태다. superseded stack은 중지 상태이며 운영 대상으로 설명하던 이전 read-only 준비 상태는 더 이상 현재 구성이 아니다.

2026-09-07 acceptance 당시 앱 129 tests, typecheck, lint(기존 warning 2건), dev metadata Next build가 통과했다. dev 전용 Dockerfile의 실제 local build와 read-only root container `/health` smoke도 통과했다. 배포 shell harness의 success, build failure, up failure, health failure, rollback, first-deploy 시나리스를 검증했고 홈서버에서도 실제 app health 실패 후 이전 이미지를 복구했다. 당시 검증한 배포 이미지는 `snapshot-d57de14f186eb41f`이며 source digest는 `d57de14f186eb41fc85d9324c07f2b749266a43d233895260570a94fd937c1fc`다.

Cloudflare tunnel version 12와 proxied DNS로 세 dev origin을 공개했다. 공개 origin에서는 health와 `/blog` SSR, GIS 로그인, Google 계정 선택, GoTrue 교환, owner 관리자 진입을 확인했다. 고유 draft는 공개 목록에서 보이지 않았고 발행 뒤 공개 상세에 title과 body가 표시됐다. local PNG 업로드는 `/assets/posts/...` Markdown 경로를 만들었고 `cdn-dev.raven.kr`의 WebP 폭 변환도 확인했다. acceptance용 database row와 source asset을 삭제한 뒤 공개 상세와 cache-bust CDN 요청이 404임을 확인했다. Day0 공개 Supabase origin은 기존 no-key 응답을 유지한다. `.github/workflows/deploy-dev.yml`은 원격에서 활성화되어 이후 `dev` push와 수동 실행에 이 검증 절차를 적용한다.
