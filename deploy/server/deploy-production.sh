#!/usr/bin/env bash
set -Eeuo pipefail

SHA="${1:-}"
APP_DIR="${RAVEN_APP_DIR:-$HOME/raven-production}"
SRC_DIR="$APP_DIR/app"
CONFIG_DIR="$APP_DIR/config"
ENV_FILE="$CONFIG_DIR/.env.production"
TUNNEL_ENV_FILE="$CONFIG_DIR/.env.tunnel"
TARGET_FILE="$CONFIG_DIR/DEPLOY_TARGET"
COMPOSE_FILE="$SRC_DIR/docker/compose.oci.yml"
IMAGE_REPO="raven-web-production"
SERVICE="web"
CONTAINER="raven-web-production"
HEALTH_TIMEOUT="${RAVEN_HEALTH_TIMEOUT:-120}"
KEEP_SHA_TAGS="${RAVEN_KEEP_SHA_TAGS:-5}"

log() { printf '\n=== %s\n' "$*"; }
die() { printf '\n!!! %s\n' "$*" >&2; exit 1; }

if ! printf '%s' "$SHA" | grep -qE '^[0-9a-f]{40}$'; then
  die "40자리 lowercase git SHA가 필요합니다."
fi

command -v flock >/dev/null || die "flock이 없습니다."
exec 200>/tmp/raven-production-deploy.lock
flock -w 600 200 || die "다른 production 배포가 10분 넘게 실행 중입니다."

compose() {
  RAVEN_ENV_FILE="$ENV_FILE" RAVEN_TUNNEL_ENV_FILE="$TUNNEL_ENV_FILE" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

env_value() {
  local key="$1" file="$2"
  sed -n -E "s/^[[:space:]]*(export[[:space:]]+)?${key}=(.*)$/\2/p" "$file" \
    | tail -n 1 | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

log "1/6 production 대상과 설정 확인"
command -v docker >/dev/null || die "docker가 없습니다."
docker compose version >/dev/null 2>&1 || die "docker compose v2가 없습니다."
[ -f "$TARGET_FILE" ] || die "$TARGET_FILE 이 없습니다."
[ "$(tr -d '\r\n' < "$TARGET_FILE")" = "raven-production" ] \
  || die "DEPLOY_TARGET이 raven-production이 아닙니다."
[ -f "$COMPOSE_FILE" ] || die "$COMPOSE_FILE 이 없습니다."
[ -f "$ENV_FILE" ] || die "$ENV_FILE 이 없습니다."
[ -f "$TUNNEL_ENV_FILE" ] || die "$TUNNEL_ENV_FILE 이 없습니다."
docker network inspect cloudflare >/dev/null 2>&1 \
  || die "external Docker network cloudflare가 없습니다."

for file in "$ENV_FILE" "$TUNNEL_ENV_FILE"; do
  mode="$(stat -c '%a' "$file" 2>/dev/null || stat -f '%Lp' "$file" 2>/dev/null || true)"
  [ "$mode" = "600" ] || die "$file 권한은 600이어야 합니다."
done

[ "$(env_value NODE_ENV "$ENV_FILE")" = "production" ] || die "NODE_ENV=production이 필요합니다."
[ "$(env_value CONTENT_SOURCE "$ENV_FILE")" = "supabase" ] || die "CONTENT_SOURCE=supabase가 필요합니다."
[ "$(env_value SITE_URL "$ENV_FILE")" = "https://raven.kr" ] || die "SITE_URL=https://raven.kr가 필요합니다."
[ "$(env_value R2_PUBLIC_URL "$ENV_FILE")" = "https://cdn.raven.kr" ] || die "R2_PUBLIC_URL=https://cdn.raven.kr가 필요합니다."

required=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_GOOGLE_CLIENT_ID CMS_OWNER_EMAILS R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET)
missing=()
for key in "${required[@]}"; do
  [ -n "$(env_value "$key" "$ENV_FILE")" ] || missing+=("$key")
done
[ -n "$(env_value TUNNEL_TOKEN "$TUNNEL_ENV_FILE")" ] || missing+=(TUNNEL_TOKEN)
if [ "${#missing[@]}" -gt 0 ]; then
  printf 'missing required configuration: %s\n' "${missing[*]}" >&2
  exit 1
fi
if [ -n "$(env_value NEXT_PUBLIC_GOOGLE_ANALYTICS_ID "$ENV_FILE")" ]; then
  printf '%s' "$(env_value NEXT_PUBLIC_GOOGLE_ANALYTICS_ID "$ENV_FILE")" | grep -qE '^G-[A-Z0-9]+$' \
    || die "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID는 GA4 Measurement ID 형식이어야 합니다."
fi
echo "  ok — production marker와 필수 설정 이름 확인 (값은 출력하지 않음)"

log "2/6 이전 이미지 보존"
PREV_ID=""
if docker image inspect "$IMAGE_REPO:current" >/dev/null 2>&1; then
  PREV_ID="$(docker image inspect -f '{{.Id}}' "$IMAGE_REPO:current")"
  docker tag "$IMAGE_REPO:current" "$IMAGE_REPO:previous"
  echo "  current -> previous"
else
  echo "  최초 배포 — 자동 롤백 이미지 없음"
fi

rollback() {
  [ -n "$PREV_ID" ] || { echo "  previous 이미지가 없어 자동 롤백할 수 없습니다." >&2; return 0; }
  docker tag "$IMAGE_REPO:previous" "$IMAGE_REPO:current"
  compose up -d --force-recreate --no-build "$SERVICE" tunnel || true
  echo "  previous 이미지로 복구를 시도했습니다."
}

failure_log() {
  docker ps -a --filter "name=^${CONTAINER}$" --format '{{.Names}}\t{{.Image}}\t{{.Status}}' || true
  # 애플리케이션 로그에는 외부 SDK 오류나 요청 정보가 포함될 수 있다. GitHub에
  # 등록되지 않은 서버 전용 secret은 Actions 마스킹 대상이 아니므로 원문을 보내지 않는다.
  docker inspect --format 'health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} exit={{.State.ExitCode}}' \
    "$CONTAINER" 2>/dev/null || true
}

log "3/6 OCI 호스트에서 이미지 빌드"
if ! DOCKER_BUILDKIT=1 compose build "$SERVICE"; then
  failure_log
  die "빌드 실패 — 실행 중인 컨테이너는 변경하지 않았습니다."
fi

log "4/6 컨테이너 기동"
if ! compose up -d --no-build --remove-orphans; then
  failure_log
  rollback
  exit 1
fi

log "5/6 프로세스 health 확인"
deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
healthy=0
while [ "$(date +%s)" -lt "$deadline" ]; do
  if docker exec "$CONTAINER" wget -qO- http://127.0.0.1:3000/health 2>/dev/null \
    | grep -q '"status":"ready"'; then
    healthy=1
    break
  fi
  sleep 3
done
if [ "$healthy" -ne 1 ]; then
  failure_log
  rollback
  die "프로세스 health 실패 — 가능한 경우 previous로 롤백했습니다."
fi
docker tag "$IMAGE_REPO:current" "$IMAGE_REPO:$SHA"
echo "  프로세스 health 통과. Supabase, OAuth, R2 readiness는 별도 수동 검증 대상입니다."

log "6/6 raven production 이미지 정리"
docker images --format '{{.Tag}}\t{{.CreatedAt}}' "$IMAGE_REPO" \
  | grep -vE '^(current|previous|<none>)\b' \
  | sort -k2 -r \
  | tail -n +$((KEEP_SHA_TAGS + 1)) \
  | cut -f1 \
  | while read -r tag; do [ -n "$tag" ] && docker rmi "$IMAGE_REPO:$tag" >/dev/null 2>&1 || true; done
docker ps --filter 'label=com.docker.compose.project=raven-production' \
  --format '{{.Names}}\t{{.Image}}\t{{.Status}}'
log "배포 준비 실행 완료: $IMAGE_REPO:$SHA"
