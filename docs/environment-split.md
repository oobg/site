# 환경 분리 계획

main 운영을 먼저 OCI로 옮기고, 그 결과를 확인한 뒤 dev를 홈서버로 분리한다. 운영과 개발의 Supabase·이미지 저장소·공개 origin을 공유하지 않는다.

## 상태 표

| 구분             | 현재                                            | 목표                               | 전환 조건                        |
| ---------------- | ----------------------------------------------- | ---------------------------------- | -------------------------------- |
| main 앱          | OCI Docker Compose에서 운영 중                  | 커밋된 main SHA의 수동 배포로 전환 | GitHub workflow 검증             |
| main 데이터/Auth | 새 Supabase Cloud와 Google 로그인 운영 중       | 현재 구성 유지                     | CMS CRUD acceptance 완료         |
| main 이미지      | R2 production bucket과 `cdn.raven.kr` 구성 완료 | 현재 구성 유지                     | 업로드·공개 읽기 acceptance 완료 |
| dev 앱           | 별도 운영 환경 없음                             | 홈서버 별도 Compose 프로젝트       | main acceptance 이후             |
| dev 데이터/Auth  | raven 전용 isolation 미정                       | self-hosted Supabase               | dev 분리 작업에서 구축           |
| dev 이미지       | 홈서버 wsrv CDN 운영 중                         | dev 앱의 local upload adapter 연결 | adapter 구현 후                  |

CMS/privacy 관련 변경은 커밋되지 않은 로컬 스냅샷으로 OCI에 배포했고 `raven.kr`을 새 production tunnel로 전환했다. 기존 홈서버 main 자동 배포 설정은 그대로 남아 있으며, 이번 전환에서 workflow는 실행하지 않았다.

## 현재 검증 현황

아래 항목은 계획이 아니라 현재 확인된 상태다.

- CMS/privacy 로컬 build·typecheck·lint·test를 완료했고, dirty source archive의 hash와 base Git HEAD를 기록해 OCI에 수동 배포했다.
- 기존 Day0 OCI에 raven 전용 app/config 디렉터리와 `raven-production` marker를 준비했고, 기존 `cloudflare` Docker network를 확인했다.
- 새 Supabase project `raven-production`은 개인 Free 조직의 서울 리전에서 `ACTIVE_HEALTHY` 상태다. migration `20260907000000` 적용, 익명 draft 0건, owner deny smoke, Site URL·redirect 설정을 확인했다.
- Google provider와 owner 등록을 완료했고, production origin에서 GIS 로그인과 owner 관리자 진입을 확인했다. 관리자 route는 인증 상태가 정적 HTML에 고정되지 않도록 runtime 렌더링한다.
- R2 `raven-assets-production`은 APAC Standard로 생성했고 `cdn.raven.kr` ownership/SSL과 host credential 구성을 완료했다. production CMS에서 이미지 업로드와 공개 읽기를 사용자가 확인했다. 기존 backup bucket은 유지한다.
- OCI script는 mock success/buildfail/upfail/healthfail/noprevious 명령 순서를 검증했으며 실제 컨테이너 rollback은 아직 검증하지 않았다.
- production tunnel의 connector health와 공개 `/health`, `/`, `/blog`, `/about`, `/admin` 응답을 확인했다. 개인정보 제거 대상 문자열은 공개 응답에 없고 삭제한 author 이미지는 404다.
- production 관리자에서 사용자가 draft 저장, 글 발행, 이미지 업로드를 확인했다. 실제 컨테이너 rollback 검증은 아직 남아 있다.
- `cdn-dev.raven.kr`은 홈서버의 wsrv 컨테이너로 연결했고 원본·리사이즈·WebP·캐시·거부 동작을 공개 origin에서 확인했다. `dev.raven.kr` 앱과 이미지 upload adapter는 아직 구축하지 않았다.
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
2. Day0용 self-hosted Supabase가 이미 존재하더라도 raven 전용 isolation은 별도 구축·결정 사항으로 다룬다.
3. `dev.raven.kr`을 dev 앱으로 라우팅한다.
4. 홈서버 dev 전용 원본 volume을 읽기 전용으로 마운트한 wsrv 이미지 CDN은 구성했다. dev 앱의 이미지 저장 adapter는 별도 구현한다.
5. 개발 이미지 주소는 `cdn-dev.raven.kr`을 사용한다.
6. dev에서도 login, draft, publish, upload, 개인정보 제거 변경, rollback을 확인한다.

## 경계와 보존 규칙

- main과 dev는 Supabase project, database, Auth 설정, R2 bucket, credentials를 공유하지 않는다.
- production R2 bucket은 dev 이미지 서버의 backup 또는 테스트 대상으로 재사용하지 않는다.
- dev local volume 제공 방식은 R2 bucket이나 R2 credentials를 필요로 하지 않는다.
- 서버 secret, 개인 정보, exact host/IP, SSH key path는 문서·workflow 로그·저장소에 쓰지 않는다.
- `origin/dev`와 `main`의 divergence는 보존한다. 환경 분리를 이유로 강제 reset, force push, 브랜치 덮어쓰기를 하지 않는다.
- 원고의 `/assets/...` 경로 계약은 유지한다. `ASSET_BASE_URL`은 현재 앱에 존재하는 설정이 아니라, dev 이미지 adapter 구현 때 검토할 미래 제안이다.

## 환경변수 매핑

production 앱이 읽는 키는 [`cms-setup.md`](cms-setup.md)와 [`deploy/env.production.example`](../deploy/env.production.example)의 표를 따른다. 값은 각 환경의 호스트 config에서 공급한다.

| 키                         | main OCI               | dev 홈서버                                |
| -------------------------- | ---------------------- | ----------------------------------------- |
| `SITE_URL`                 | `https://raven.kr`     | `https://dev.raven.kr`                    |
| `CONTENT_SOURCE`           | `supabase`             | self-hosted Supabase adapter 구현 후 결정 |
| `NEXT_PUBLIC_SUPABASE_URL` | 새 Supabase Cloud URL  | raven dev isolation 구축 후 결정          |
| `R2_PUBLIC_URL`            | `https://cdn.raven.kr` | 현재 dev local volume에는 적용하지 않음   |
| `R2_BUCKET`                | production 전용 bucket | 현재 dev local volume에는 적용하지 않음   |

dev의 이미지 저장소와 asset base 환경변수는 adapter 구현이 끝난 뒤 확정한다. 실제 secret 값은 문서에 기록하지 않는다.
