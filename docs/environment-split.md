# 환경 분리 계획

main 운영을 먼저 OCI로 옮기고, 그 결과를 확인한 뒤 dev를 홈서버로 분리한다. dev는 기존 Day0와 외부 Kong 하나만 공유하며 database, Auth, REST, API key, 이미지 저장소와 공개 origin은 분리한다.

dev와 main은 같은 애플리케이션 소스를 사용한다. 변경은 dev에서 실제 로그인, CMS, 이미지 업로드와 rollback까지 검증한 뒤 main에 정상 병합하고, 배포 환경의 변수만으로 production과 dev 동작을 나눈다. 환경 분리를 위해 애플리케이션 기능을 서로 다른 branch 전용 구현으로 유지하지 않는다. dev의 고정 target 검사와 배포 marker는 잘못된 서버나 설정으로 배포하는 것을 막는 운영 안전장치로 유지한다.

## 상태 표

| 구분             | 현재                                            | 목표                               | 전환 조건                        |
| ---------------- | ----------------------------------------------- | ---------------------------------- | -------------------------------- |
| main 앱          | OCI Docker Compose에서 운영 중                  | 커밋된 main SHA의 수동 배포로 전환 | GitHub workflow 검증             |
| main 데이터/Auth | 새 Supabase Cloud와 Google 로그인 운영 중       | 현재 구성 유지                     | CMS CRUD acceptance 완료         |
| main 이미지      | R2 production bucket과 `cdn.raven.kr` 구성 완료 | 현재 구성 유지                     | 업로드·공개 읽기 acceptance 완료 |
| dev 앱           | 홈서버 별도 Compose로 공개·운영 중              | 동일 구성 유지                     | health와 rollback 확인 완료      |
| dev 데이터/Auth  | shared Kong + Raven 전용 backend 운영 중        | 동일 구성 유지                     | migration, key 격리, OAuth 완료  |
| dev 이미지       | wsrv CDN과 local upload adapter 운영 중         | 동일 구성 유지                     | volume upload·변환 확인 완료     |

CMS/privacy와 Markdown 미리보기 변경은 `ca6af3a06a8d23f901031ef7a2e449fdb1ac5283` 소스로 OCI에 배포했고 `raven.kr`은 production tunnel을 사용한다. 기존 홈서버 main 자동 배포 설정은 그대로 남아 있다.

## 현재 검증 현황

아래 항목은 계획이 아니라 현재 확인된 상태다.

- production에 배포한 `ca6af3a06a8d23f901031ef7a2e449fdb1ac5283` 소스는 로컬 전체 31개 test file, 107개 test를 통과했다.
- 기존 Day0 OCI에 raven 전용 app/config 디렉터리와 `raven-production` marker를 준비했고, 기존 `cloudflare` Docker network를 확인했다.
- 새 Supabase project `raven-production`은 개인 Free 조직의 서울 리전에서 `ACTIVE_HEALTHY` 상태다. migration `20260907000000` 적용, 익명 draft 0건, owner deny smoke, Site URL·redirect 설정을 확인했다.
- Google provider와 owner 등록을 완료했고, production origin에서 GIS 로그인과 owner 관리자 진입을 확인했다. 관리자 route는 인증 상태가 정적 HTML에 고정되지 않도록 runtime 렌더링한다.
- R2 `raven-assets-production`은 APAC Standard로 생성했고 `cdn.raven.kr` ownership/SSL과 host credential 구성을 완료했다. production CMS에서 이미지 업로드와 공개 읽기를 사용자가 확인했다. 기존 backup bucket은 유지한다.
- OCI script는 mock success/buildfail/upfail/healthfail/noprevious 명령 순서를 검증했으며 실제 컨테이너 rollback은 아직 검증하지 않았다.
- production tunnel의 connector health와 공개 `/health`, `/`, `/blog`, `/about`, `/admin` 응답을 확인했다. 개인정보 제거 대상 문자열은 공개 응답에 없고 삭제한 author 이미지는 404다.
- production 관리자에서 사용자가 draft 저장, 글 발행, 이미지 업로드를 확인했다. 실제 컨테이너 rollback 검증은 아직 남아 있다.
- `cdn-dev.raven.kr`은 홈서버의 wsrv 컨테이너로 연결했고 원본·리사이즈·WebP·캐시·거부 동작을 공개 origin에서 확인했다.
- dev 소스는 `ca6af3a06a8d23f901031ef7a2e449fdb1ac5283`을 기준으로 재구성했다. 이전 dev 끝점은 원격 `backup/dev-before-rebuild-20260907`의 `1c6ce17841398cfbccff579d4a0fcd63470d3177`에 보존했다. 중단한 병합안은 적용하지 않았고 main에는 push하지 않았다.
- 홈서버 SSH와 기존 Day0 Kong 설정을 read-only로 확인했고 Raven 전용 Google OAuth client를 생성했다. production과 Day0 OAuth client는 변경하지 않았다.
- dev 전용 Compose, 배포 script, local upload adapter와 환경 예시를 구현했다. Raven DB/Auth/REST migration과 provider, 공유 gateway, 내부 health·실제 rollback, 공개 `dev.raven.kr`의 로그인·draft·publish·upload acceptance를 완료했다.
- Cloudflare tunnel version 12와 proxied DNS를 유지한 채 세 dev origin을 공개했다. acceptance용 database row와 source asset은 검증 후 삭제했고 공개 상세와 cache-bust CDN에서 404를 확인했다. Day0 공개 Supabase origin은 기존 no-key 응답을 유지한다.
- 실제 개인 이메일·계정명·key 값과 private secret path는 기록하지 않았다. Git commit·push와 production workflow 실행도 하지 않았다.

## 단계

### A. main OCI 전환

1. 새 Supabase Cloud 프로젝트에 migration을 적용하고 Google OAuth callback을 `raven.kr` 기준으로 설정한다.
2. production 전용 R2 bucket과 `cdn.raven.kr` custom domain을 준비한다. 기존 backup bucket을 재사용하지 않는다.
3. `.github/workflows/deploy-production.yml`을 `workflow_dispatch`로 실행할 수 있도록 OCI host marker, Cloudflare network, 호스트 config 파일을 준비한다.
4. 입력 SHA가 `origin/main`의 조상인지 확인한 workflow가 Tailscale·SSH·rsync로 소스를 전달하고 `deploy/server/deploy-production.sh`를 OCI에서 실행하는지 확인한다.
5. runtime secret은 GitHub에서 주입하지 않고 OCI 호스트의 mode `600` config 파일에서 읽는지 확인한다.
6. 다음 acceptance를 수행한다.

   - Auth login
   - draft 저장 후 비공개 확인
   - publish 후 공개 목록/상세 확인
   - R2 업로드와 `cdn.raven.kr` 읽기
   - privacy 관련 개인정보 제거 변경 확인 (`/privacy` 페이지는 현재 없음)
   - 의도적 health 실패 시 `previous` 이미지 재기동 확인

7. workflow 자체는 typecheck·lint·test를 실행하지 않으므로 로컬 및 기존 홈서버 workflow 결과를 별도로 확인한다.

### B. dev 분리

main acceptance 이후에만 진행한다.

1. 홈서버에 dev 전용 Compose project와 컨테이너 이름을 만든다.
2. 기존 Kong에 Raven Host route를 추가하되 Raven database, Auth, REST, consumer, ACL과 API key는 Day0와 분리한다. 별도 조직 관리 UI는 두지 않는다.
3. `dev.raven.kr`을 dev 앱으로 라우팅한다.
4. 홈서버 dev 전용 원본 volume은 wsrv에 읽기 전용, dev 앱에 쓰기 가능으로 각각 마운트한다. local adapter는 URL의 `/assets/`를 제외한 `posts/...`를 volume root에 기록한다.
5. 개발 이미지 주소는 `cdn-dev.raven.kr`을 사용한다.
6. dev에서도 login, draft, publish, upload, 개인정보 제거 변경, rollback을 확인한다.

## 경계와 보존 규칙

- main과 dev는 Supabase project, database, Auth 설정, R2 bucket, credentials를 공유하지 않는다. 홈서버의 Day0와 Raven은 외부 Kong만 공유하며 데이터와 인증 key는 공유하지 않는다.
- production R2 bucket은 dev 이미지 서버의 backup 또는 테스트 대상으로 재사용하지 않는다.
- dev local volume 제공 방식은 R2 bucket이나 R2 credentials를 필요로 하지 않는다.
- 서버 secret, 개인 정보, exact host/IP, SSH key path는 문서·workflow 로그·저장소에 쓰지 않는다.
- 재구성 전 dev는 `backup/dev-before-rebuild-20260907`에 보존한다. 보관 stash나 patch를 새 dev에 통째로 적용하지 않는다.
- 원고의 `/assets/...` 경로 계약은 유지한다. dev는 `ASSET_STORAGE_BACKEND=local`, `ASSET_LOCAL_ROOT`, `ASSET_PUBLIC_URL=https://cdn-dev.raven.kr`을 사용하며 production R2 credentials를 함께 두지 않는다.
- dev의 metadata와 Open Graph origin은 `SITE_URL=https://dev.raven.kr`을 따르고 검색엔진에는 `noindex, nofollow`를 제공한다.

## 환경변수 매핑

production 앱이 읽는 키는 [`cms-setup.md`](cms-setup.md)와 [`deploy/env.production.example`](../deploy/env.production.example)의 표를 따른다. 값은 각 환경의 호스트 config에서 공급한다.

| 키                         | main OCI               | dev 홈서버                                |
| -------------------------- | ---------------------- | ----------------------------------------- |
| `SITE_URL`                 | `https://raven.kr`     | `https://dev.raven.kr`                    |
| `SITE_INDEXABLE`           | `true` 또는 기본값     | `false`                                   |
| `CONTENT_SOURCE`           | `supabase`             | `supabase`                                |
| `NEXT_PUBLIC_SUPABASE_URL` | 새 Supabase Cloud URL  | raven dev 전용 Supabase URL               |
| `ASSET_STORAGE_BACKEND`    | `r2` 또는 기본값       | `local`                                   |
| `ASSET_LOCAL_ROOT`         | 사용하지 않음          | dev 앱에 쓰기 가능으로 마운트한 원본 root |
| `ASSET_PUBLIC_URL`         | 사용하지 않음          | `https://cdn-dev.raven.kr`                |
| `R2_PUBLIC_URL`            | `https://cdn.raven.kr` | 사용하지 않음                             |
| `R2_BUCKET`                | production 전용 bucket | 사용하지 않음                             |

dev 설치와 검증 순서는 [`dev-setup.md`](dev-setup.md)를 따른다. 실제 secret 값은 문서에 기록하지 않는다.

`SITE_INDEXABLE`은 검색 허용 여부를 명시하며 hostname 추론에 의존하지 않는다. `ASSET_STORAGE_BACKEND=r2`는 production R2 설정을, `local`은 dev local volume 설정을 선택한다. Supabase URL과 publishable key, Google client ID와 server-side provider secret도 각 배포 환경의 값을 사용한다. 2026-09-07 acceptance 당시 이 same-code 환경 계약과 dev 배포 gate는 129개 test와 실제 서버 검증을 통과했다. 당시 검증한 dev 앱은 dirty snapshot digest `d57de14f186eb41fc85d9324c07f2b749266a43d233895260570a94fd937c1fc`의 `snapshot-d57de14f186eb41f` 이미지다. dev workflow는 원격에서 활성화되어 `dev` push와 수동 SHA 배포에 적용된다.
