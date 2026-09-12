#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RAVEN_CDN_DEV_DIR:-/srv/docker/raven-cdn-dev}"
ASSET_DIR="$APP_DIR/assets"
COMPOSE_FILE="$APP_DIR/compose.yml"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ "$APP_DIR" = "/srv/docker/raven-cdn-dev" ] || die "unexpected app directory"
[ -d "$APP_DIR" ] && [ ! -L "$APP_DIR" ] || die "app directory guard failed"
[ -d "$ASSET_DIR" ] && [ ! -L "$ASSET_DIR" ] || die "asset directory guard failed"
[ -f "$COMPOSE_FILE" ] && [ ! -L "$COMPOSE_FILE" ] || die "compose file guard failed"
[ -f "$APP_DIR/nginx.conf" ] && [ ! -L "$APP_DIR/nginx.conf" ] || die "nginx config guard failed"

docker network inspect nginx-proxy-manager_default >/dev/null 2>&1 \
  || die "tunnel network is missing"

docker compose -f "$COMPOSE_FILE" config --quiet
docker compose -f "$COMPOSE_FILE" pull images
docker compose -f "$COMPOSE_FILE" up -d --no-build --force-recreate images

deadline=$(( $(date +%s) + 90 ))
state=""
while [ "$(date +%s)" -lt "$deadline" ]; do
  state="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' raven-cdn-dev 2>/dev/null || true)"
  [ "$state" = "healthy" ] && break
  sleep 3
done
[ "$state" = "healthy" ] || die "cdn dev health check failed"

docker inspect -f '{{.Name}} {{.State.Status}}/{{.State.Health.Status}}' raven-cdn-dev
