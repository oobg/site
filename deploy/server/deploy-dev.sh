#!/usr/bin/env bash
set -Eeuo pipefail

SHA="${1:-}"
APP_ROOT="${RAVEN_DEV_DIR:-/srv/docker/raven-dev}"
SRC_DIR="$APP_ROOT/app"
CONFIG_DIR="$APP_ROOT/config"
ENV_FILE="$CONFIG_DIR/.env.dev"
TARGET_FILE="$CONFIG_DIR/DEPLOY_TARGET"
COMPOSE_FILE="$SRC_DIR/docker/dev/compose.yml"
RELEASE_FILE="$SRC_DIR/.raven-release"
SOURCE_HELPER="$SRC_DIR/deploy/server/dev-source.py"
IMAGE_REPO="raven-web-dev"
CONTAINER="raven-web-dev"
HEALTH_TIMEOUT="${RAVEN_DEV_HEALTH_TIMEOUT:-120}"

log() { printf '\n=== %s\n' "$*"; }
die() { printf '\nerror: %s\n' "$*" >&2; exit 1; }

env_value() {
  local key="$1"
  sed -n -E "s/^[[:space:]]*(export[[:space:]]+)?${key}=(.*)$/\\2/p" "$ENV_FILE" \
    | tail -n 1 | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

if ! printf '%s' "$SHA" | grep -qE '^[0-9a-f]{40}$'; then
  die "40-character lowercase Git SHA is required"
fi
[ "$APP_ROOT" = "/srv/docker/raven-dev" ] || die "unexpected Raven dev directory"
[ -d "$APP_ROOT" ] && [ ! -L "$APP_ROOT" ] || die "Raven dev directory guard failed"
[ -d "$SRC_DIR" ] && [ ! -L "$SRC_DIR" ] || die "source directory guard failed"
[ -d "$CONFIG_DIR" ] && [ ! -L "$CONFIG_DIR" ] || die "config directory guard failed"
[ -f "$TARGET_FILE" ] && [ ! -L "$TARGET_FILE" ] || die "deployment marker is missing"
[ "$(tr -d '\r\n' < "$TARGET_FILE")" = "raven-dev" ] || die "deployment marker does not match"

command -v flock >/dev/null || die "flock is required"
if [ "${RAVEN_DEV_LOCK_HELD:-}" = "1" ]; then
  [ "$(readlink /proc/$$/fd/200 2>/dev/null || true)" = "/tmp/raven-dev-deploy.lock" ] \
    || die "inherited deployment lock is invalid"
  flock -n 200 || die "inherited deployment lock is not held"
else
  exec 200>/tmp/raven-dev-deploy.lock
  flock -w 600 200 || die "another Raven dev deployment is still running"
fi

[ -f "$COMPOSE_FILE" ] && [ ! -L "$COMPOSE_FILE" ] || die "dev Compose file is missing"
[ -f "$RELEASE_FILE" ] && [ ! -L "$RELEASE_FILE" ] || die "source release manifest is missing"
[ -f "$SOURCE_HELPER" ] && [ ! -L "$SOURCE_HELPER" ] || die "source fingerprint helper is missing"
[ -f "$ENV_FILE" ] && [ ! -L "$ENV_FILE" ] || die "dev environment file is missing"

release_value() {
  local key="$1"
  sed -n -E "s/^${key}=(.*)$/\\1/p" "$RELEASE_FILE" | tail -n 1
}

base_sha="$(release_value BASE_GIT_SHA)"
source_state="$(release_value SOURCE_STATE)"
expected_source_sha="$(release_value SOURCE_SHA256)"
[ "$base_sha" = "$SHA" ] || die "release manifest base SHA does not match"
printf '%s' "$source_state" | grep -qE '^(clean|dirty)$' || die "release source state is invalid"
printf '%s' "$expected_source_sha" | grep -qE '^[0-9a-f]{64}$' \
  || die "release source hash is invalid"

command -v python3 >/dev/null || die "python3 is required"
actual_source_sha="$(python3 "$SOURCE_HELPER" digest "$SRC_DIR")"
[ "$actual_source_sha" = "$expected_source_sha" ] \
  || die "staged source does not match its release manifest"
if [ "$source_state" = "clean" ]; then
  IMAGE_TAG="$SHA"
else
  IMAGE_TAG="snapshot-${actual_source_sha:0:16}"
fi

mode="$(stat -c '%a' "$ENV_FILE" 2>/dev/null || stat -f '%Lp' "$ENV_FILE" 2>/dev/null || true)"
[ "$mode" = "600" ] || die "dev environment file mode must be 600"
[ "$(env_value NODE_ENV)" = "production" ] || die "NODE_ENV must be production"
[ "$(env_value CONTENT_SOURCE)" = "supabase" ] || die "CONTENT_SOURCE must be supabase"
[ "$(env_value SITE_URL)" = "https://dev.raven.kr" ] || die "SITE_URL must target dev.raven.kr"
[ "$(env_value SITE_INDEXABLE)" = "false" ] || die "SITE_INDEXABLE must disable indexing"
[ "$(env_value ASSET_STORAGE_BACKEND)" = "local" ] || die "asset backend must be local"
[ "$(env_value ASSET_LOCAL_ROOT)" = "/srv/assets" ] || die "asset root must be /srv/assets"
[ "$(env_value ASSET_PUBLIC_URL)" = "https://cdn-dev.raven.kr" ] \
  || die "asset public URL must target cdn-dev.raven.kr"
[ "$(env_value NEXT_PUBLIC_SUPABASE_URL)" = "https://supabase-dev.raven.kr" ] \
  || die "Supabase URL must target supabase-dev.raven.kr"

required=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY NEXT_PUBLIC_GOOGLE_CLIENT_ID CMS_OWNER_EMAILS)
missing=()
for key in "${required[@]}"; do
  [ -n "$(env_value "$key")" ] || missing+=("$key")
done
[ "${#missing[@]}" -eq 0 ] || die "required dev configuration is missing: ${missing[*]}"

production_keys=(R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_PUBLIC_URL)
for key in "${production_keys[@]}"; do
  [ -z "$(env_value "$key")" ] || die "$key must not be present in local asset mode"
done

command -v docker >/dev/null || die "docker is required"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is required"
docker network inspect nginx-proxy-manager_default >/dev/null 2>&1 \
  || die "existing tunnel network is missing"
[ -d /srv/docker/raven-cdn-dev/assets ] \
  && [ ! -L /srv/docker/raven-cdn-dev/assets ] \
  || die "CDN asset directory guard failed"

compose() {
  env -i PATH="$PATH" HOME="$HOME" DOCKER_BUILDKIT=1 \
    RAVEN_DEV_ENV_FILE="$ENV_FILE" \
    RAVEN_DEV_ASSET_DIR=/srv/docker/raven-cdn-dev/assets \
    docker compose -p raven-dev -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

log "validate Raven dev Compose"
compose config --quiet

log "preserve the previous web image"
previous=""
running_id="$(docker inspect -f '{{.Image}}' "$CONTAINER" 2>/dev/null || true)"
running_health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || true)"
if [ -n "$running_id" ] \
  && [ "$running_health" = "healthy" ] \
  && docker exec "$CONTAINER" wget -qO- http://127.0.0.1:3000/health 2>/dev/null \
    | grep -q '"status":"ready"' \
  && docker image inspect "$running_id" >/dev/null 2>&1; then
  previous="$running_id"
  docker tag "$running_id" "$IMAGE_REPO:previous"
fi

safe_status() {
  docker ps -a --filter "name=^${CONTAINER}$" \
    --format '{{.Names}}\t{{.Image}}\t{{.Status}}' || true
  docker inspect --format 'health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} exit={{.State.ExitCode}}' \
    "$CONTAINER" 2>/dev/null || true
}

rollback() {
  [ -n "$previous" ] || { printf 'No previous web image is available.\n' >&2; return 0; }
  docker tag "$IMAGE_REPO:previous" "$IMAGE_REPO:current"
  compose up -d --force-recreate --no-deps --no-build web || return 1
  rollback_deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
  while [ "$(date +%s)" -lt "$rollback_deadline" ]; do
    if docker exec "$CONTAINER" wget -qO- http://127.0.0.1:3000/health 2>/dev/null \
      | grep -q '"status":"ready"'; then
      printf 'Previous Raven dev web image is healthy.\n'
      return 0
    fi
    sleep 3
  done
  printf 'Previous Raven dev web image did not become healthy.\n' >&2
  return 1
}

log "build Raven dev web image"
if ! compose build web; then
  safe_status
  die "web image build failed; running services were not changed"
fi

log "start Raven dev web only"
if ! compose up -d --no-deps --no-build web; then
  safe_status
  rollback || true
  exit 1
fi

log "check internal web health"
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
  safe_status
  rollback || true
  die "internal web health check failed"
fi

docker tag "$IMAGE_REPO:current" "$IMAGE_REPO:$IMAGE_TAG"
safe_status
log "Raven dev web deployment prepared: $IMAGE_REPO:$IMAGE_TAG (base $SHA, $source_state source)"
