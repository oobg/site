# 프론트 배포 설계 (홈서버 + nginx-proxy-manager)

> 상태: **합의됨**. 프론트(raven.kr, Next.js standalone)를 백엔드와 같은 홈서버에 docker compose로 배포.
> 협의: cmux "homeserver" 워크스페이스의 백엔드 Claude 세션(`~/private/01_project/api`)과 배포 구성 합의 완료.
> 선행: foundation·블로그·프로젝트·글로벌 nav 마일스톤(main 머지 완료).

## 배경 / 서버 실체 (백엔드 조사 기반 사실)

- **origin 라우팅은 Cloudflare Tunnel이 아니라 nginx-proxy-manager(NPM)**. (기존 메모리의 "Cloudflare Tunnel" 기술은 부정확 — 정정 필요. Cloudflare는 DNS/프록시 앞단에 남아있을 수 있으나 레포로는 미확인.)
- hostname→origin 매핑은 NPM 대시보드(별도 프로젝트)에서 관리. 현재 `api.raven.kr → api:3000`. `raven.kr`은 아직 NPM에 없음.
- 백엔드: `docker/compose.prod.yml` 단일 서비스 `api`, self-hosted 러너에서 `docker compose up -d --build`(레지스트리 없음), 포트 미publish(expose만), external 네트워크 `npm`(=`nginx-proxy-manager_default`)·`supabase`(=`supabase_default`) join.
- **`api.raven.kr /content/*`는 아직 미구현** → 프론트는 `CONTENT_SOURCE=mock`으로 배포하고, content 모듈이 나오면 서버 fetch base URL만 `api`로 플립(server-side fetch라 `NEXT_PUBLIC_` 불필요).

## 목표

- 프론트를 홈서버에 docker compose로 배포, NPM이 `raven.kr → raven-web:3000`으로 라우팅.
- 백엔드와 정합되는 `docker/` 레이아웃·deploy 워크플로.
- 실패 시 이전 이미지로 자동 롤백. 정상 배포가 롤백되지 않도록 헬스 엔드포인트 구비.

## 결정 (오너 승인)

1. **`docker/` 레이아웃으로 이동** — 루트 `Dockerfile` → `docker/Dockerfile`, `docker/compose.prod.yml` 신규. 백엔드와 동일 구조로 deploy.yml 복제 정합성 확보.
2. **배포 게이트 = `typecheck && lint && test`** — docker 빌드가 이미 `pnpm build`를 돌리므로 게이트에선 vitest 스위트(27개)로. 빌드 중복 회피.
3. **`public/`은 `.gitkeep`으로 생성** — standalone 런타임이 `public/`을 기대하므로 COPY 유지 + 빈 디렉터리 생성.

## 변경/신규 파일

**이동+수정**

- `Dockerfile` → `docker/Dockerfile`

**신규**

- `public/.gitkeep`
- `docker/compose.prod.yml`
- `.github/workflows/deploy.yml`
- `src/app/health/route.ts`

**수정**

- `package.json` — `packageManager: pnpm@9.15.0` → `pnpm@9.12.0` (락파일·CI action-setup 버전 정렬)

## 1. `docker/Dockerfile`

기존 내용 유지하되 두 가지 수정:

- **husky footgun**: base 스테이지에 `ENV HUSKY=0` 추가 → `pnpm install`의 `prepare: husky`가 no-op(prod 이미지에 git/husky 불필요).
- **public/ COPY**: `public/.gitkeep`으로 디렉터리를 만들어 `COPY --from=build /app/public ./public` 성공.
- compose가 `context: ..` + `dockerfile: docker/Dockerfile`을 쓰므로 `COPY . .`·`.dockerignore`(루트)는 그대로 동작.

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
ENV HUSKY=0

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## 2. `docker/compose.prod.yml`

백엔드 compose 구조 복제, 프론트 조정(서비스 `web`, `container_name: raven-web`, npm 네트워크만, supabase 제외, healthcheck `/health`).

```yaml
services:
  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    image: ${PROJECT_NAME:-raven-web}:${IMAGE_TAG:-latest}
    container_name: raven-web
    env_file: .env
    environment:
      NODE_ENV: production
      TZ: Asia/Seoul
    restart: unless-stopped
    expose:
      - '3000'
    networks:
      - npm
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://127.0.0.1:3000/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: json-file
      options:
        max-size: '10m'
        max-file: '3'

networks:
  npm:
    external: true
    name: nginx-proxy-manager_default
```

## 3. `.github/workflows/deploy.yml`

백엔드 패턴 복제 + 프론트 조정(DB 마이그·supabase 삭제, 게이트 조정, 서비스명 `web`, 헬스 폴링 `/health`).

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: self-hosted
    env:
      APP_NAME: ${{ github.ref_name }}-${{ secrets.PROJECT_NAME }}
      PROJECT_NAME: ${{ secrets.PROJECT_NAME }}
      IMAGE_TAG: ${{ github.sha }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: 게이트
        run: pnpm typecheck && pnpm lint && pnpm test
      - name: .env 생성
        env:
          REVALIDATE_SECRET: ${{ secrets.REVALIDATE_SECRET }}
        run: |
          umask 177
          mkdir -p docker
          printf '%s\n' \
            'NODE_ENV=production' \
            'CONTENT_API_BASE=https://api.raven.kr' \
            'CONTENT_SOURCE=mock' \
            "REVALIDATE_SECRET=${REVALIDATE_SECRET}" \
            > docker/.env
      - name: 빌드 · 기동 · 헬스체크 (실패 시 롤백)
        run: |
          set -euo pipefail
          docker network inspect nginx-proxy-manager_default >/dev/null 2>&1 || docker network create nginx-proxy-manager_default
          PREV_CID=$(docker compose -p "$APP_NAME" -f docker/compose.prod.yml ps -q web 2>/dev/null || echo "")
          PREV_IMAGE=$([ -n "$PREV_CID" ] && docker inspect --format '{{.Image}}' "$PREV_CID" || echo "")
          docker compose -p "$APP_NAME" -f docker/compose.prod.yml up -d --build
          ok=""
          for i in $(seq 1 15); do
            cid=$(docker compose -p "$APP_NAME" -f docker/compose.prod.yml ps -q web)
            if [ -n "$cid" ] && docker exec "$cid" wget -qO- http://127.0.0.1:3000/health | grep -q '"status":"ready"'; then ok=1; break; fi
            sleep 3
          done
          if [ -z "$ok" ]; then
            docker compose -p "$APP_NAME" -f docker/compose.prod.yml logs --tail=200 web || true
            if [ -n "$PREV_IMAGE" ]; then
              docker tag "$PREV_IMAGE" "$PROJECT_NAME:rollback"
              IMAGE_TAG=rollback docker compose -p "$APP_NAME" -f docker/compose.prod.yml up -d
            else
              docker compose -p "$APP_NAME" -f docker/compose.prod.yml down
            fi
            exit 1
          fi
```

- **게이트 = `typecheck && lint && test`** (결정 2). `test`는 `vitest run`.
- `CONTENT_API_BASE`·`CONTENT_SOURCE`는 비밀 아님 → 워크플로에 리터럴. `REVALIDATE_SECRET`만 secret.
- 서비스명 `web`, 헬스 폴링 `/health`에서 `{"status":"ready"}` grep — 백엔드의 `api`/`/health/ready`와 차이.

## 4. `src/app/health/route.ts`

배포 롤백 폴링·compose healthcheck용. 캐시 안 됨.

```ts
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ready' });
}
```

## 5. `package.json` 정합

- `"packageManager": "pnpm@9.15.0"` → `"pnpm@9.12.0"` (락파일 생성 버전·CI `pnpm/action-setup@v4 version: 9.12.0`과 일치, `--frozen-lockfile` 안정).

## 검증

- **로컬 도커 빌드**(docker 사용 가능 시): `docker build -f docker/Dockerfile -t raven-web:test .` 성공 → `docker run --rm -p 3000:3000 raven-web:test` 후 `/` 200·`/health`가 `{"status":"ready"}` 반환.
- `pnpm typecheck && pnpm lint && pnpm test` 그린(게이트 사전 검증).
- health 라우트 유닛 테스트 1개(GET이 `{status:'ready'}` 반환) — TDD.
- deploy.yml은 실행 자체는 서버에서만 검증 가능 → 문법·경로·서비스명 정합만 리뷰로 확인.

## 오너 수동 작업 (레포 밖 — 배포 트리거 전 필요)

1. 프론트 GitHub 레포 secrets: `PROJECT_NAME=raven-web`, `REVALIDATE_SECRET`(백엔드와 동일 값).
2. 프론트 레포에 self-hosted 러너 연결 확인(백엔드와 동일 러너 공유 시 동시 배포는 큐잉됨 — 충돌 아님).
3. NPM 대시보드: `raven.kr → raven-web:3000` proxy host 추가(프론트 컨테이너가 npm 네트워크에 떠야 라우팅됨).
4. `main` 푸시(현재 `origin/main` 대비 미푸시 커밋 존재)로 배포 트리거.

## 스코프 밖

- `CONTENT_SOURCE=api` 플립 — 백엔드 content 모듈 배포 후 별도(base URL만 교체).
- 내부 DNS alias(cross-compose network alias) — 헤어핀으로 MVP 충분, 병목 시 전환.
- Cloudflare DNS/프록시 앞단 설정 — 오너/서버 실물 관리.
- 프론트 전용 러너 분리 — 공유 러너로 시작.
