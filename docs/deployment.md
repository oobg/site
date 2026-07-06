# 배포

프론트(raven.kr)는 홈서버에 docker compose로 배포된다. origin 라우팅은 nginx-proxy-manager(NPM).

## 구성

- `docker/Dockerfile` — Next.js standalone 멀티스테이지 빌드.
- `docker/compose.prod.yml` — 서비스 `web`(`container_name: raven-web`), external 네트워크 `npm`(=`nginx-proxy-manager_default`).
- `.github/workflows/deploy.yml` — self-hosted 러너가 서버에서 직접 `docker compose up -d --build`. 게이트 `typecheck && lint && test`. `/health` 폴링 실패 시 이전 이미지 롤백.

## 트리거

- `main` push 자동, 또는 Actions 탭에서 `workflow_dispatch` 수동.

## 오너 수동 작업 (최초 1회)

1. GitHub 레포 secrets: `PROJECT_NAME=raven-web`, `REVALIDATE_SECRET`(백엔드와 동일 값).
2. 프론트 레포에 self-hosted 러너 연결(백엔드와 러너 공유 시 동시 배포는 큐잉).
3. NPM 대시보드: proxy host `raven.kr → raven-web:3000` 추가.

## 환경변수 (`docker/.env`, 워크플로가 생성)

| 변수                | 값                     | 비고                                |
| ------------------- | ---------------------- | ----------------------------------- |
| `NODE_ENV`          | `production`           |                                     |
| `CONTENT_API_BASE`  | `https://api.raven.kr` | 백엔드 콘텐츠 API                   |
| `CONTENT_SOURCE`    | `mock`                 | content 모듈 배포 후 `api`로 플립   |
| `REVALIDATE_SECRET` | (secret)               | 백엔드와 동일, revalidate 웹훅 인증 |

## content 소스 플립 (백엔드 content 모듈 배포 후)

`.github/workflows/deploy.yml`의 `.env 생성` 스텝에서 `CONTENT_SOURCE=mock` → `CONTENT_SOURCE=api`로 바꾸고 재배포. 서버사이드 fetch라 그 외 변경 없음.
