# 프론트 배포 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프론트(raven.kr, Next.js standalone)를 홈서버에 docker compose로 배포 가능하게 만든다 — Dockerfile 수정·`docker/` 레이아웃·compose·GitHub Actions deploy 워크플로·health 엔드포인트.

**Architecture:** 백엔드와 정합되는 `docker/` 레이아웃. self-hosted 러너가 서버에서 직접 `docker compose up -d --build`, NPM(nginx-proxy-manager)이 `raven.kr → raven-web:3000` 라우팅. 실패 시 이전 이미지 롤백, `/health` 폴링으로 정상 배포 보장. content 미구현이라 `CONTENT_SOURCE=mock`으로 시작.

**Tech Stack:** Next.js 16 standalone, node:22-alpine, pnpm 9.12.0, docker compose, GitHub Actions(self-hosted), nginx-proxy-manager.

## Global Constraints

- 패키지 매니저 **pnpm 9.12.0**(락파일·CI 정렬). 테스트 `pnpm test`(vitest run), 타입체크 `pnpm typecheck`, 린트 `pnpm lint`.
- **`docker/` 레이아웃**: Dockerfile·compose는 `docker/` 아래. compose는 `context: ..`(레포 루트)·`dockerfile: docker/Dockerfile`.
- 서비스명 **`web`**, `container_name: raven-web`, external 네트워크 **`npm`**(=`nginx-proxy-manager_default`)만 join, 포트 publish 금지(expose만).
- 게이트 = **`typecheck && lint && test`** (docker 빌드가 `pnpm build` 수행하므로 게이트 build 중복 회피).
- 프론트 배포 env: `NODE_ENV=production`, `CONTENT_API_BASE=https://api.raven.kr`, `CONTENT_SOURCE=mock`, `REVALIDATE_SECRET`(secret). base URL·source는 리터럴, secret만 GitHub secret.
- health 엔드포인트 `/health` → `{"status":"ready"}`(200), 캐시 안 됨.
- 커밋: Conventional Commits(자연어 한국어), 꼬리말 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- husky/lint-staged pre-commit이 스테이징 파일에 prettier·eslint 자동 실행.
- **주의**: `.dockerignore`(루트)는 `node_modules .next .git docs` 제외 — 유지. `docs`가 제외되므로 docs 변경은 이미지에 무영향.

---

### Task 1: health 엔드포인트

배포 롤백 폴링·compose healthcheck가 때리는 `/health` 라우트. TDD.

**Files:**

- Create: `src/app/health/route.ts`
- Test: `src/app/health/__tests__/route.test.ts`

**Interfaces:**

- Produces: `GET(): Response` at route `/health` — JSON body `{ status: 'ready' }`, HTTP 200. `export const dynamic = 'force-dynamic'`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/health/__tests__/route.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/health/route';

describe('GET /health', () => {
  it('status ready를 200으로 반환한다', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ready' });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- src/app/health/__tests__/route.test.ts`
Expected: FAIL — "Failed to resolve import ... @/app/health/route" (route 미존재)

- [ ] **Step 3: 라우트 구현**

`src/app/health/route.ts`:

```ts
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ready' });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- src/app/health/__tests__/route.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: 빌드에 라우트 노출 확인**

Run: `pnpm build`
Expected: 빌드 성공, 라우트 목록에 `/health` 표시(`ƒ /health` 동적).

- [ ] **Step 6: Commit**

```bash
git add src/app/health/route.ts src/app/health/__tests__/route.test.ts
git commit -m "feat(health): /health 엔드포인트 추가

배포 롤백 폴링·compose healthcheck용. { status: 'ready' } 200 반환, 캐시 안 함.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Dockerfile 수정 + docker/ 이동 + public/·pnpm 정합

Dockerfile을 `docker/`로 옮기고 husky/public footgun을 고친다. `public/.gitkeep`·`packageManager` 정합 포함(같은 배포 단위이므로 한 태스크로 묶음).

**Files:**

- Move: `Dockerfile` → `docker/Dockerfile` (수정 포함)
- Create: `public/.gitkeep`
- Modify: `package.json` (packageManager 버전)

**Interfaces:**

- Produces: `docker/Dockerfile`(멀티스테이지, runner가 `.next/standalone`+`.next/static`+`public` COPY, `EXPOSE 3000`, `CMD ["node","server.js"]`). Task 3 compose가 `dockerfile: docker/Dockerfile`로 참조.

- [ ] **Step 1: public/ 디렉터리 생성**

```bash
mkdir -p public
: > public/.gitkeep
```

- [ ] **Step 2: Dockerfile을 docker/로 이동 + 수정**

```bash
mkdir -p docker
git mv Dockerfile docker/Dockerfile
```

그리고 `docker/Dockerfile`을 아래로 만든다(변경점: base에 `ENV HUSKY=0`):

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

- [ ] **Step 3: packageManager 버전 정합**

`package.json`에서:

```json
"packageManager": "pnpm@9.15.0",
```

을 다음으로 변경:

```json
"packageManager": "pnpm@9.12.0",
```

- [ ] **Step 4: 로컬 도커 빌드 검증 (docker 있으면)**

Run: `docker build -f docker/Dockerfile -t raven-web:test . && docker run --rm -d -p 3000:3000 --name raven-web-test raven-web:test && sleep 4 && curl -fsS localhost:3000/health && echo && curl -fsS -o /dev/null -w '%{http_code}\n' localhost:3000/ ; docker rm -f raven-web-test`
Expected: 이미지 빌드 성공(husky 에러·public COPY 에러 없음), `/health`가 `{"status":"ready"}`, `/`가 `200`.

docker가 이 환경에 없으면: 스킵하고 그 사실을 리포트에 기록. 서버 배포 담당 세션에서 검증하도록 컨트롤러에 에스컬레이션.

- [ ] **Step 5: 타입/테스트 회귀 확인**

Run: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test`
Expected: 락파일 정합(9.12.0 표기로 frozen-lockfile 통과), typecheck 0, 테스트 그린.

- [ ] **Step 6: Commit**

```bash
git add docker/Dockerfile public/.gitkeep package.json
git commit -m "build: Dockerfile을 docker/로 이동 + husky/public/pnpm 정합

ENV HUSKY=0으로 prod install prepare footgun 제거, public/.gitkeep으로
standalone public COPY 성공, packageManager 9.12.0으로 락파일·CI 정렬.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: docker/compose.prod.yml

프론트 서비스 compose. 백엔드 구조 복제하되 서비스 `web`·npm 네트워크만.

**Files:**

- Create: `docker/compose.prod.yml`

**Interfaces:**

- Consumes: `docker/Dockerfile`(Task 2), `docker/.env`(deploy.yml Task 4가 런타임에 생성 — 레포엔 커밋 안 함).
- Produces: compose 서비스 `web`(`container_name: raven-web`), external 네트워크 `npm`. Task 4 deploy.yml이 `-f docker/compose.prod.yml`·`ps -q web`로 참조.

- [ ] **Step 1: compose 작성**

`docker/compose.prod.yml`:

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

- [ ] **Step 2: compose 문법 검증 (docker 있으면)**

`docker/.env`가 없어도 config 파싱은 되도록 임시 빈 env로 검증:

```bash
touch docker/.env && docker compose -f docker/compose.prod.yml config >/dev/null && echo OK ; rm -f docker/.env
```

Expected: `OK`(YAML·스키마 유효). docker 없으면 스킵하고 리포트에 기록.

- [ ] **Step 3: .env가 커밋되지 않는지 확인**

Run: `git status --porcelain docker/.env`
Expected: 출력 없음(존재 안 하거나 이미 ignore). 존재하면 `.gitignore`에 `docker/.env` 추가.

`.gitignore`에 `docker/.env`가 없으면 추가:

```
docker/.env
```

- [ ] **Step 4: Commit**

```bash
git add docker/compose.prod.yml .gitignore
git commit -m "build: docker/compose.prod.yml 추가

서비스 web(container_name raven-web), npm external 네트워크만 join,
expose 3000·/health healthcheck·이미지 태그 변수화. docker/.env는 gitignore.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: .github/workflows/deploy.yml

self-hosted 러너 배포 워크플로. 백엔드 패턴 복제 + 프론트 조정(DB마이그·supabase 삭제, 게이트 `test`, 서비스 `web`, 헬스 `/health`).

**Files:**

- Create: `.github/workflows/deploy.yml`

**Interfaces:**

- Consumes: `docker/compose.prod.yml`(Task 3), `docker/Dockerfile`(Task 2), `src/app/health/route.ts`(Task 1). GitHub secrets `PROJECT_NAME`·`REVALIDATE_SECRET`(오너가 설정).

- [ ] **Step 1: 워크플로 작성**

`.github/workflows/deploy.yml`:

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
        with:
          version: 9.12.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
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

- [ ] **Step 2: YAML 문법 검증**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml')); print('YAML OK')"`
Expected: `YAML OK`.

- [ ] **Step 3: 정합성 자체 점검(읽기)**

확인 항목(리포트에 근거 명시):

- 서비스명이 compose(`web`)와 deploy(`ps -q web`)에서 일치.
- 헬스 경로 `/health`가 route(Task 1)·compose healthcheck·deploy 폴링에서 일치.
- pnpm 버전 `9.12.0`이 packageManager·action-setup에서 일치.
- 게이트가 `typecheck && lint && test`.
- supabase 네트워크·DB 마이그레이션 스텝 없음.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: self-hosted 배포 워크플로 추가

main push/수동 트리거, 게이트 typecheck·lint·test, 서버 직접 build·기동,
/health 폴링 실패 시 이전 이미지 롤백. content 미구현이라 CONTENT_SOURCE=mock.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 배포 문서 (README 섹션)

오너 수동 작업·플립 절차를 레포에 남긴다. 배포 지식이 대화에만 있으면 유실되므로.

**Files:**

- Create: `docs/deployment.md`

**Interfaces:** 없음(문서).

- [ ] **Step 1: 문서 작성**

`docs/deployment.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/deployment.md
git commit -m "docs: 배포 절차·오너 수동 작업 문서화

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- Dockerfile 수정(husky·public) → Task 2 ✅
- docker/ 레이아웃 이동 → Task 2 ✅
- compose.prod.yml → Task 3 ✅
- deploy.yml(게이트·롤백·서비스명·헬스) → Task 4 ✅
- health route → Task 1 ✅
- packageManager 9.12.0 → Task 2 ✅
- CONTENT_SOURCE=mock env → Task 4 ✅
- 오너 수동 작업 문서화 → Task 5 ✅
- docker/.env 비커밋 → Task 3 (gitignore) ✅

**Placeholder scan:** 모든 스텝에 실제 코드·명령·예상 출력. TBD 없음. docker 미가용 시 스킵+에스컬레이션 경로 명시(추측 금지). ✅

**Type/정합 consistency:**

- 서비스명 `web`: compose(Task 3)·deploy `ps -q web`(Task 4) 일치.
- 헬스 `/health` + `{"status":"ready"}`: route(Task 1)·compose healthcheck(Task 3)·deploy 폴링(Task 4) 일치.
- pnpm `9.12.0`: packageManager(Task 2)·action-setup(Task 4) 일치.
- `docker/Dockerfile` 경로: 이동(Task 2)·compose `dockerfile:`(Task 3)·(deploy는 compose 경유) 일치.
- 게이트 `typecheck && lint && test`: 스펙·Task 4 일치. ✅

## 스코프 밖 (이 계획에 없음)

- `CONTENT_SOURCE=api` 플립(백엔드 content 모듈 후).
- 내부 DNS alias.
- Cloudflare DNS/프록시 설정.
- 실제 서버에서의 배포 실행(오너/배포 담당 세션 소관).
