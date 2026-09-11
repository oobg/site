#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${RAVEN_SUPABASE_DEV_DIR:-/srv/docker/raven-dev/supabase}"
PARENT="${ROOT%/*}"
DOCKER_DIR="$ROOT/docker"
ENV_FILE="$DOCKER_DIR/.env"
BASE_FILE="$DOCKER_DIR/docker-compose.yml"
OVERRIDE_FILE="$DOCKER_DIR/docker-compose.raven-dev.yml"
PROJECT="raven-supabase-dev"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ "$ROOT" = "/srv/docker/raven-dev/supabase" ] || die "unexpected Supabase directory"
[ -f "$PARENT/config/DEPLOY_TARGET" ] && [ ! -L "$PARENT/config/DEPLOY_TARGET" ] \
  || die "Raven dev marker is missing"
[ "$(tr -d '\r\n' < "$PARENT/config/DEPLOY_TARGET")" = "raven-dev" ] \
  || die "Raven dev marker does not match"
[ -d "$DOCKER_DIR" ] && [ ! -L "$DOCKER_DIR" ] || die "Supabase directory guard failed"
[ -f "$BASE_FILE" ] && [ -f "$OVERRIDE_FILE" ] || die "Supabase Compose files are missing"

compose_version="$(docker compose version --short)"
minimum_version="2.24.4"
[ "$(printf '%s\n%s\n' "$minimum_version" "$compose_version" | sort -V | head -n 1)" = "$minimum_version" ] \
  || die "Docker Compose 2.24.4 or newer is required"

compose() {
  env -i PATH="$PATH" HOME="$HOME" \
    POSTGRES_HOST=db POSTGRES_PORT=5432 POSTGRES_DB=postgres \
    docker compose --project-name "$PROJECT" --env-file "$ENV_FILE" \
    -f "$BASE_FILE" -f "$OVERRIDE_FILE" "$@"
}

if [ "${1:-}" = "status" ]; then
  exec docker ps --filter "label=com.docker.compose.project=$PROJECT" \
    --format '{{.Names}}\t{{.Image}}\t{{.Status}}'
fi

[ -f "$ENV_FILE" ] && [ ! -L "$ENV_FILE" ] || die "private Supabase environment is missing"
mode="$(stat -c '%a' "$ENV_FILE" 2>/dev/null || stat -f '%Lp' "$ENV_FILE" 2>/dev/null || true)"
[ "$mode" = "600" ] || die "private Supabase environment mode must be 600"

env_value() {
  local key="$1"
  sed -n -E "s/^[[:space:]]*(export[[:space:]]+)?${key}=(.*)$/\\2/p" "$ENV_FILE" \
    | tail -n 1 | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

[ "$(env_value POSTGRES_HOST)" = "db" ] || die "POSTGRES_HOST must be db"
[ "$(env_value POSTGRES_PORT)" = "5432" ] || die "POSTGRES_PORT must be 5432"
[ "$(env_value POSTGRES_DB)" = "postgres" ] || die "POSTGRES_DB must be postgres"
[ "$(env_value SITE_URL)" = "https://dev.raven.kr" ] || die "SITE_URL must target dev.raven.kr"
api_url="$(env_value API_EXTERNAL_URL)"
public_url="$(env_value SUPABASE_PUBLIC_URL)"
[ "$api_url" = "https://supabase-dev.raven.kr/auth/v1" ] \
  || die "API_EXTERNAL_URL must target the Raven dev Auth endpoint"
[ "${api_url%/auth/v1}" = "$public_url" ] || die "Supabase public and Auth origins must match"
[ "$(env_value GOOGLE_ENABLED)" = "true" ] || die "Google provider must be enabled"

required_secrets=(POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY GOOGLE_CLIENT_ID GOOGLE_SECRET)
for key in "${required_secrets[@]}"; do
  value="$(env_value "$key")"
  [ -n "$value" ] || die "$key is missing"
  case "$value" in
    *your-super-secret*|*replace_*|*example*|*placeholder*) die "$key still contains a placeholder" ;;
  esac
done

compose config --quiet

case "${1:-}" in
  start)
    compose up -d --wait db auth rest
    [ "$(docker network inspect -f '{{index .Labels "raven.scope"}}' raven-supabase-api 2>/dev/null)" = "dev" ] \
      || die "Raven Supabase API network is missing or has the wrong scope"
    for entry in "raven-supabase-dev-auth:raven-auth" "raven-supabase-dev-rest:raven-rest"; do
      container="${entry%%:*}"
      alias="${entry#*:}"
      [ "$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$container")" = "$PROJECT" ] \
        || die "unexpected project label on $container"
      aliases="$(docker inspect -f '{{with index .NetworkSettings.Networks "raven-supabase-api"}}{{range .Aliases}}{{println .}}{{end}}{{end}}' "$container")"
      if [ "$aliases" != "$alias" ]; then
        docker network disconnect raven-supabase-api "$container" >/dev/null 2>&1 || true
        docker network connect --alias "$alias" raven-supabase-api "$container"
      fi
      aliases="$(docker inspect -f '{{range (index .NetworkSettings.Networks "raven-supabase-api").Aliases}}{{println .}}{{end}}' "$container")"
      [ "$aliases" = "$alias" ] || die "unexpected shared gateway aliases on $container"
    done
    ;;
  stop)
    compose stop
    ;;
  *)
    die "usage: $0 {start|status|stop}"
    ;;
esac
