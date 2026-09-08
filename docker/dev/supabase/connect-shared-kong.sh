#!/usr/bin/env bash
set -Eeuo pipefail

NETWORK=raven-supabase-api
KONG=supabase-kong

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ "$(docker network inspect -f '{{index .Labels "raven.scope"}}' "$NETWORK" 2>/dev/null)" = dev ] \
  || die "Raven Supabase API network is missing or has the wrong scope"
[ "$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$KONG" 2>/dev/null)" = supabase ] \
  || die "shared Kong project guard failed"

if ! docker inspect -f '{{json .NetworkSettings.Networks}}' "$KONG" \
  | python3 -c 'import json,sys; raise SystemExit(0 if "raven-supabase-api" in json.load(sys.stdin) else 1)'; then
  docker network connect "$NETWORK" "$KONG"
fi

for entry in raven-supabase-dev-auth:raven-auth raven-supabase-dev-rest:raven-rest; do
  container="${entry%%:*}"
  expected="${entry#*:}"
  aliases="$(docker inspect -f '{{with index .NetworkSettings.Networks "raven-supabase-api"}}{{range .Aliases}}{{println .}}{{end}}{{end}}' "$container")"
  [ "$aliases" = "$expected" ] || die "unexpected API network aliases on $container"
done

printf 'Shared Kong network attachment is ready.\n'
