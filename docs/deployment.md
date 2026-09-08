# 배포

이 문서는 raven.kr의 현재 배포 상태와 main 운영 환경을 OCI로 옮기는 순서를 설명한다. main을 먼저 완료한 뒤 dev를 분리한다.

## 현재 상태

- 공개 Next 앱은 OCI의 `raven-production` Docker Compose에서 실행하며 Cloudflare tunnel을 통해 `raven.kr`에 제공한다.
- production은 `ca6af3a06a8d23f901031ef7a2e449fdb1ac5283` 소스로 OCI에 배포되어 운영 중이며 해당 운영 상태와 release metadata는 보존한다.
- 기존 홈서버의 `main` push workflow와 컨테이너 구성은 삭제하거나 변경하지 않았다. 이번 OCI 배포에서 GitHub workflow는 실행하지 않았다.

dev는 `ca6af3a06a8d23f901031ef7a2e449fdb1ac5283`으로 재구성했고 재구성 전 끝점 `1c6ce17841398cfbccff579d4a0fcd63470d3177`은 `backup/dev-before-rebuild-20260907`에 보존했다. 중단한 병합안은 취소했으며 main에는 push하지 않았다.

## 현재 검증 현황

- CMS/privacy 변경은 로컬 build·typecheck·lint·test를 통과했고 OCI production에 배포했다.
- 기존 Day0 OCI 호스트에 raven 전용 app/config 디렉터리와 `raven-production` marker가 준비되어 있고, 기존 `cloudflare` Docker network를 확인했다.
- 개인 Free 조직의 새 Supabase project `raven-production`은 서울 리전에 `ACTIVE_HEALTHY` 상태이며 migration `20260907000000`을 적용했다. 익명 사용자의 draft 조회 0건, owner deny smoke를 확인했고 Site URL과 redirect 설정을 등록했다.
- CMS owner와 Supabase Google provider를 구성했고 production origin에서 Google 로그인과 owner 관리자 진입을 확인했다.
- R2 `raven-assets-production` bucket은 APAC Standard로 생성했고 `cdn.raven.kr` ownership/SSL과 OCI host credential 구성을 완료했다. production CMS 이미지 업로드와 공개 읽기를 사용자가 확인했다. 기존 backup bucket은 유지한다.
- OCI deploy script의 mock success, build failure, up failure, health failure, no-previous 명령 순서를 검증했다. 실제 컨테이너 rollback은 아직 검증하지 않았다.
- 새 production tunnel의 connector health와 공개 `/health`, `/`, `/blog`, `/about`, `/admin` 응답을 확인했다. 개인정보 제거 대상 문자열은 공개 응답에 없고 삭제한 author 이미지는 404다.
- 로그인 뒤 새 글 화면이 build-time 환경에 고정되던 문제를 발견해 관리자 segment를 runtime 렌더링으로 바꾸고 재배포했다. production build의 prerender manifest에서 관리자 경로가 제외됨을 확인했다.
- production 관리자에서 사용자가 draft 저장, 글 발행, 이미지 업로드를 확인했다. 실제 컨테이너 rollback 검증은 아직 남아 있다.
- Cloudflare tunnel version 12와 proxied DNS로 `dev.raven.kr`, `supabase-dev.raven.kr`, `cdn-dev.raven.kr`을 공개했고 Raven 앱, 전용 DB/Auth/REST, shared Kong route와 wsrv CDN을 확인했다. production과 Day0 OAuth client 및 서비스는 변경하지 않았다.
- 실제 개인 이메일, 계정명, key 값과 private secret path는 문서에 기록하지 않는다. 저장소 commit·push와 production workflow 실행은 하지 않았다.

## 목표 구조와 순서

### 1. main: OCI + Supabase Cloud + R2

main 운영 완료 후의 구성은 다음과 같다.

- Next 앱: OCI의 Docker Compose 서비스
- 콘텐츠와 Auth: 새 Supabase Cloud 프로젝트
- 이미지 공개 URL: Cloudflare R2 custom domain `https://cdn.raven.kr`
- 공개 origin: `https://raven.kr`
- 배포: `.github/workflows/deploy-production.yml`의 `workflow_dispatch` 수동 실행

main acceptance는 실제 운영 origin에서 다음을 확인한다.

1. Google Auth 로그인과 관리자 접근 제어가 동작한다.
2. `/admin`에서 draft를 저장할 수 있고 공개 목록·상세에는 draft가 보이지 않는다.
3. 발행한 글이 공개 목록·상세에 보인다.
4. 이미지를 업로드하면 `cdn.raven.kr`에서 읽힌다.
5. privacy 관련 개인정보 제거 변경이 운영 origin에 반영된다. 현재 `/privacy` 페이지 자체는 없다.
6. 배포 실패 시 health check가 실패하고 가능한 경우 이전 이미지가 재기동된다.

main acceptance 전에는 production 자동 배포로 바꾸지 않는다. 현재 OCI workflow는 테스트 게이트를 실행하지 않으므로 typecheck·lint·test는 로컬 및 기존 홈서버 workflow에서 별도로 검증한다.

### 2. dev: 홈서버 + self-hosted Supabase + 개발 이미지 서버

main acceptance가 끝난 뒤에만 dev를 분리한다.

- 앱: 기존 홈서버의 별도 dev Compose 프로젝트
- 데이터와 Auth: 기존 Day0와 외부 Kong 하나를 공유하고 Raven 전용 database, Auth, REST, consumer, ACL, API key, container와 volume을 사용한다. 별도 조직 관리 UI는 두지 않는다.
- 공개 개발 origin: `https://dev.raven.kr`
- 이미지: 홈서버의 별도 원본 volume을 wsrv가 읽기 전용으로 처리한다.
- 개발 이미지 공개 URL: `https://cdn-dev.raven.kr`

wsrv CDN과 공개 도메인, dev local adapter와 전용 Compose·배포 script를 구축했다. 예시는 `https://cdn-dev.raven.kr/assets/smoke.png?w=320&output=webp`이다. 앱 volume 쓰기, CDN 읽기와 변환, 실제 앱 health 실패 후 이전 이미지 rollback을 서버에서 확인했다. local volume 방식에서는 `R2_BUCKET`이나 R2 credentials를 사용하지 않는다. 자세한 운영 계약은 [`cdn-dev.md`](cdn-dev.md), 설치와 acceptance는 [`dev-setup.md`](dev-setup.md)를 따른다.

공유 Kong에는 Day0 전체 route와 consumer를 보존한 합성 설정과 Raven 전용 network alias를 적용했다. 실제 gateway에서 두 프로젝트의 정상 key는 자기 REST에 200, 교차 key는 403, Raven 무인증 요청은 401, Raven 허용 외 경로는 404, Auth callback은 303임을 확인했다. Kong 이미지는 `kong:3.9.1`이며 source와 runtime rollback 자료를 보존했다.

dev 공개 전에는 Raven 전용 database 초기화와 migration/RLS, Auth provider, 앱 내부 health, 이미지 volume 쓰기와 CDN 읽기, 실패 rollback을 순서대로 확인한다. metadata와 Open Graph는 `https://dev.raven.kr`을 사용하고 검색 노출은 `noindex, nofollow`여야 한다. production과 Day0의 데이터, Auth, key, container와 이미지 저장소가 바뀌지 않았음도 함께 확인한다.

공개 acceptance에서 Google GIS부터 GoTrue 교환과 owner 관리자 진입까지 확인했다. 고유 draft는 공개 목록에 노출되지 않았고 발행 뒤 상세 title과 body가 표시됐다. local PNG 업로드는 `/assets/posts/...` Markdown을 만들었고 CDN WebP 폭 변환도 성공했다. 테스트 row와 원본 asset을 정확히 삭제한 뒤 공개 상세와 cache-bust CDN 요청이 모두 404임을 확인했다. Day0 공개 Supabase origin도 기존 no-key 응답에 도달한다.

dev에서 검증한 애플리케이션 변경은 main에 정상 병합해 같은 코드를 배포한다. production은 `SITE_URL=https://raven.kr`, `SITE_INDEXABLE=true`, `ASSET_STORAGE_BACKEND=r2`와 production Supabase·Google·R2 설정을 사용한다. dev는 `SITE_URL=https://dev.raven.kr`, `SITE_INDEXABLE=false`, `ASSET_STORAGE_BACKEND=local`과 Raven dev 전용 Supabase·Google 설정을 사용한다. dev 배포 marker와 origin 검사는 잘못된 target에 배포하지 않기 위한 별도 안전장치다. `.github/workflows/deploy-dev.yml`은 `dev` push와 수동 SHA 배포용으로 로컬에 작성하고 검증했지만 commit·push하지 않았다.

## 현재 홈서버 배포

관련 파일은 `docker/Dockerfile`, `docker/compose.prod.yml`, `.github/workflows/deploy.yml`이다. `main` push 또는 Actions의 `workflow_dispatch`가 self-hosted runner에서 typecheck·lint·test를 통과한 뒤 Docker Compose build, 기동, `/health` 확인과 실패 시 이전 이미지 복구를 수행한다.

최초 설정에서 필요한 값은 [`cms-setup.md`](cms-setup.md)의 환경변수 표와 같다. 비밀값, 개인 이메일, 서버 IP, SSH 경로는 이 문서나 저장소에 기록하지 않는다.

## OCI 구현과 수동 배포

현재 구현 파일은 다음과 같다.

- `.github/workflows/deploy-production.yml` — `workflow_dispatch` 입력 SHA를 받아 checkout하고, SHA가 `origin/main`의 조상인지 확인한다. Tailscale에 합류한 뒤 SSH로 연결하고, 검증한 소스를 rsync하며 서버 script를 실행한다.
- `docker/compose.oci.yml` — `raven-production` compose project, `raven-web-production` web, Cloudflare tunnel, external `cloudflare` network를 정의한다.
- `deploy/server/deploy-production.sh` — OCI 호스트의 build·기동·health 확인·이미지 정리를 수행한다.
- `deploy/env.production.example` — production 앱 환경변수 템플릿
- `deploy/env.tunnel.example` — Cloudflare tunnel 환경변수 템플릿

OCI 호스트 setup은 다음 계약을 만족해야 한다.

- Ubuntu 사용자 `ubuntu`가 `$HOME/raven-production/app`과 `$HOME/raven-production/config`를 사용한다.
- `$HOME/raven-production/config/DEPLOY_TARGET`의 내용은 `raven-production`이어야 한다.
- `$HOME/raven-production/config/.env.production`과 `.env.tunnel`을 호스트에서 만들고 mode `600`으로 유지한다.
- external Docker network `cloudflare`가 존재해야 한다.
- deploy script는 `/tmp/raven-production-deploy.lock`에 `flock`을 걸어 배포를 직렬화한다.

GitHub Actions에는 앱 runtime secret을 주입하지 않는다. workflow가 사용하는 연결 설정은 production environment의 `DEPLOY_HOST`, `DEPLOY_HOST_KEY` variables와 `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY` secrets이다. 앱의 Supabase·CMS·R2·tunnel 값은 OCI 호스트의 위 config 파일에만 둔다.

배포 script는 먼저 `raven-web-production:current` 이미지를 `previous`로 tag하고, OCI에서 새 이미지를 build한다. compose 기동 시 기존 컨테이너가 교체될 수 있으므로 health 확인 전 기존 컨테이너가 보존된다고 가정하지 않는다. build 실패 시 실행 중 컨테이너를 변경하지 않고, 기동 또는 health 실패 시 `previous` 이미지가 있으면 재기동한다. 최초 배포처럼 이전 이미지가 없으면 자동 image rollback은 불가능하며, 실패 상태를 남긴다. DNS 또는 Cloudflare tunnel의 이전 경로를 이용한 외부 rollback은 별도 수동 운영 절차다.

## 환경변수 원칙

`CONTENT_SOURCE=supabase`, `SITE_URL=https://raven.kr`, `R2_PUBLIC_URL=https://cdn.raven.kr`은 production script가 요구한다. `NEXT_PUBLIC_SUPABASE_URL`, publishable key, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, CMS owner allowlist, R2 credentials, bucket 이름은 OCI 호스트의 `.env.production`에서 읽는다. 세 `NEXT_PUBLIC_*` 값은 browser bundle에 들어가므로 Docker build argument로도 전달한다. Google client ID가 없으면 production CMS 배포를 중단하지만 기존 홈서버의 기본 `CONTENT_SOURCE=mock` 빌드는 빈 값으로 계속 동작한다. 실제 값은 이 저장소에 두지 않는다.

## 운영 전환 기록

OCI main은 공개 origin과 실제 Google 로그인까지 전환했고, 사용자가 draft 저장·글 발행·이미지 업로드를 확인했다. 현재 운영 소스는 `ca6af3a06a8d23f901031ef7a2e449fdb1ac5283`이며 로컬 전체 31개 test file, 107개 test를 통과했다. 실제 rollback 확인과 production 자동 배포 방식 결정은 남아 있다.
